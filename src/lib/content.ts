import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export interface Source {
  label: string;
  type: string;
  treatment: string;
}

export interface Story {
  id: string;
  slug: string;
  lifeId: string;
  title: string;
  excerpt: string;
  category: string;
  date?: string;
  year?: number;
  access: 'public';
  image?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  source?: Source;
  html: string;
  readingMinutes: number;
}

export interface Life {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  years?: string;
  intro: string;
  description: string;
  hero: string;
  heroUrl: string;
  heroAlt: string;
  heroCaption?: string;
  accent?: string;
  theme?: string;
  quote?: string;
  quoteAttribution?: string;
  facts: { label: string; value: string }[];
  storyOrder: string[];
  stories: Story[];
}

export interface MediaAsset {
  /** Public URL; path segments are URL-encoded. */
  url: string;
  /** Unencoded route parameter for Astro's [...path] endpoint. */
  routePath: string;
  absolutePath: string;
  mime: string;
}

export interface Library {
  edition: { id: string; title: string; description: string };
  lives: Life[];
}

export interface ContentOptions {
  contentRoot?: string;
  /** Defaults to MLB_EDITION, or demo when the environment variable is absent. */
  edition?: string;
}

type RecordValue = Record<string, unknown>;
type RawStory = { filename: string; data: RecordValue; markdown: string; id: string; access: 'public' | 'private' };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_MIMES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
};

function fail(context: string, message: string): never {
  throw new Error(`[MyLifeBook content] ${context}: ${message}`);
}

function object(value: unknown, context: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(context, 'expected an object');
  return value as RecordValue;
}

function string(value: unknown, context: string, fallback?: string): string {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || !value.trim()) fail(context, 'expected nonempty text');
  return value;
}

function optionalString(value: unknown, context: string): string | undefined {
  return value === undefined ? undefined : string(value, context);
}

function slug(value: unknown, context: string): string {
  const result = string(value, context);
  if (!SLUG.test(result)) fail(context, 'use lowercase letters, numbers, and single hyphens');
  return result;
}

function stringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value)) fail(context, 'expected a list');
  const result = value.map((entry, index) => slug(entry, `${context}[${index}]`));
  if (new Set(result).size !== result.length) fail(context, 'duplicate entries are not allowed');
  return result;
}

function inside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/** Validate both the written path and symlink-resolved destination. */
function checkedPath(parent: string, child: string, kind: 'file' | 'directory', context: string): string {
  if (!inside(parent, child)) fail(context, 'path must remain inside its owning folder');
  if (!fs.existsSync(child)) fail(context, `missing ${kind}`);
  const actual = fs.realpathSync(child);
  if (!inside(fs.realpathSync(parent), actual)) fail(context, 'symlink escapes its owning folder');
  const stat = fs.statSync(actual);
  if (kind === 'file' ? !stat.isFile() : !stat.isDirectory()) fail(context, `expected a ${kind}`);
  return actual;
}

function readJson(filename: string): RecordValue {
  try {
    return object(JSON.parse(fs.readFileSync(filename, 'utf8')), filename);
  } catch (error) {
    fail(filename, `could not read JSON (${error instanceof Error ? error.message : String(error)})`);
  }
}

function readStories(lifeDir: string, lifeId: string): RawStory[] {
  const storiesDir = checkedPath(lifeDir, path.join(lifeDir, 'stories'), 'directory', `${lifeId}/stories`);
  const files = fs.readdirSync(storiesDir).filter((filename) => filename.endsWith('.md')).sort();
  return files.map((filename) => {
    const context = `${lifeId}/stories/${filename}`;
    const storyPath = checkedPath(storiesDir, path.join(storiesDir, filename), 'file', context);
    let parsed: ReturnType<typeof matter>;
    try {
      const source = fs.readFileSync(storyPath, 'utf8').replace(/^\uFEFF/, '');
      // gray-matter also ships an executable JavaScript engine. Only a bare YAML
      // delimiter is accepted, before its engine dispatch can see this input.
      if (!/^---[ \t]*\r?\n/.test(source)) fail(context, 'begin with a plain --- line and YAML frontmatter');
      parsed = matter(source, { language: 'yaml' });
    } catch (error) {
      fail(context, `could not read frontmatter (${error instanceof Error ? error.message : String(error)})`);
    }
    const data = object(parsed.data, context);
    const id = slug(data.id, `${context}.id`);
    if (id !== filename.slice(0, -3)) fail(context, 'id must match the Markdown filename');
    const access = data.access ?? 'private';
    if (access !== 'public' && access !== 'private') fail(context, 'access must be public or private');
    return { filename, data, markdown: parsed.content, id, access };
  });
}

function imageMatchesExtension(bytes: Buffer, extension: string): boolean {
  if (extension === '.jpg' || extension === '.jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === '.png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === '.gif') return ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'));
  if (extension === '.webp') return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (extension === '.avif') return bytes.subarray(4, 8).toString('ascii') === 'ftyp' && /avif|avis/.test(bytes.subarray(8, 32).toString('ascii'));
  return false;
}

function registerMedia(lifeDir: string, lifeId: string, reference: string, assets: Map<string, MediaAsset>): string {
  const context = `${lifeId} media ${JSON.stringify(reference)}`;
  const relative = reference.replace(/^media\//, '');
  if (!relative || relative.includes('\\') || /[?#%\x00-\x1f:]/.test(relative) || relative.startsWith('/') || relative.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
    fail(context, 'use a relative filename inside this life’s media folder');
  }
  const extension = path.extname(relative).toLowerCase();
  const mime = IMAGE_MIMES[extension];
  if (!mime) fail(context, 'unsupported media format; use JPG, PNG, WebP, GIF, or AVIF');
  const mediaDir = checkedPath(lifeDir, path.join(lifeDir, 'media'), 'directory', context);
  const absolutePath = checkedPath(mediaDir, path.resolve(mediaDir, relative), 'file', context);
  const routePath = `${lifeId}/${relative}`;
  const url = `/media/${routePath.split('/').map(encodeURIComponent).join('/')}`;
  if (!assets.has(url)) {
    const handle = fs.openSync(absolutePath, 'r');
    const signature = Buffer.alloc(32);
    try { fs.readSync(handle, signature, 0, signature.length, 0); } finally { fs.closeSync(handle); }
    if (!imageMatchesExtension(signature, extension)) fail(context, 'file content does not match its image extension');
    assets.set(url, { url, routePath, absolutePath, mime });
  }
  return url;
}

function renderMarkdown(markdown: string, lifeDir: string, lifeId: string, selectedIds: Set<string>, assets: Map<string, MediaAsset>): string {
  const rawHtml = marked.parse(markdown, { async: false, gfm: true }) as string;
  return sanitizeHtml(rawHtml, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'title', 'loading', 'decoding'], '*': ['id'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: [] },
    allowProtocolRelative: false,
    transformTags: {
      img: (_tag, attributes) => {
        const src = registerMedia(lifeDir, lifeId, string(attributes.src, `${lifeId} Markdown image`), assets);
        if (!attributes.alt?.trim()) fail(lifeId, 'Markdown images need descriptive alt text');
        return { tagName: 'img', attribs: { src, alt: attributes.alt, ...(attributes.title ? { title: attributes.title } : {}), loading: 'lazy', decoding: 'async' } };
      },
      a: (_tag, attributes) => {
        const href = attributes.href ?? '';
        if (href.startsWith('story:')) {
          const id = slug(href.slice(6), `${lifeId} story link`);
          if (!selectedIds.has(id)) fail(lifeId, `story link references missing or excluded story "${id}"`);
          return { tagName: 'a', attribs: { href: `/lives/${lifeId}/stories/${id}/`, ...(attributes.title ? { title: attributes.title } : {}) } };
        }
        // Never expose an arbitrary local source path in published output.
        if (href && !href.startsWith('#') && !/^(https?:|mailto:)/i.test(href)) fail(lifeId, `unsupported link "${href}"; use an external URL, #anchor, or story:id`);
        return { tagName: 'a', attribs: { ...(href ? { href } : {}), ...(attributes.title ? { title: attributes.title } : {}), ...(href.startsWith('http') ? { rel: 'noopener noreferrer' } : {}) } };
      },
    },
  });
}

function loadLife(root: string, lifeId: string, requestedIds: string[] | undefined, assets: Map<string, MediaAsset>): Life {
  const livesRoot = checkedPath(root, path.join(root, 'lives'), 'directory', 'lives');
  const lifeDir = checkedPath(livesRoot, path.join(livesRoot, lifeId), 'directory', lifeId);
  const data = readJson(checkedPath(lifeDir, path.join(lifeDir, 'life.json'), 'file', `${lifeId}/life.json`));
  if (slug(data.id, `${lifeId}.id`) !== lifeId) fail(lifeId, 'id must match the life folder name');
  const rawStories = readStories(lifeDir, lifeId);
  const byId = new Map(rawStories.map((story) => [story.id, story]));
  const configuredOrder = data.storyOrder === undefined ? [] : stringArray(data.storyOrder, `${lifeId}.storyOrder`);
  for (const id of configuredOrder) if (!byId.has(id)) fail(lifeId, `storyOrder references missing story "${id}"`);
  const orderedIds = requestedIds ?? [...configuredOrder, ...rawStories.map((story) => story.id).filter((id) => !configuredOrder.includes(id))].filter((id) => byId.get(id)?.access === 'public');
  const selected = orderedIds.map((id) => {
    const story = byId.get(id);
    if (!story) fail(lifeId, `edition references missing story "${id}"`);
    if (story.access !== 'public') fail(lifeId, `edition cannot publish private story "${id}"; protected delivery is not implemented`);
    return story;
  });
  const selectedIds = new Set(orderedIds);
  const stories: Story[] = selected.map(({ id, data: story, markdown }) => {
    const context = `${lifeId}/${id}`;
    const source = story.source === undefined ? undefined : object(story.source, `${context}.source`);
    const image = optionalString(story.image, `${context}.image`);
    if (story.year !== undefined && (typeof story.year !== 'number' || !Number.isInteger(story.year))) fail(context, 'year must be an integer');
    const html = renderMarkdown(markdown, lifeDir, lifeId, selectedIds, assets);
    const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
    return {
      id, slug: id, lifeId, access: 'public',
      title: string(story.title, `${context}.title`),
      excerpt: string(story.excerpt, `${context}.excerpt`, ''),
      category: string(story.category, `${context}.category`, ''),
      date: optionalString(story.date, `${context}.date`),
      year: story.year as number | undefined,
      image,
      imageUrl: image ? registerMedia(lifeDir, lifeId, image, assets) : undefined,
      imageAlt: image ? string(story.imageAlt, `${context}.imageAlt`) : undefined,
      imageCaption: optionalString(story.imageCaption, `${context}.imageCaption`),
      source: source ? { label: string(source.label, `${context}.source.label`), type: string(source.type, `${context}.source.type`), treatment: string(source.treatment, `${context}.source.treatment`) } : undefined,
      html,
      readingMinutes: Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200)),
    };
  });
  const hero = string(data.hero, `${lifeId}.hero`);
  const accent = optionalString(data.accent, `${lifeId}.accent`);
  if (accent && !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent)) fail(lifeId, 'accent must be a three- or six-digit hex color');
  const facts = data.facts ?? [];
  if (!Array.isArray(facts)) fail(lifeId, 'facts must be a list');
  return {
    id: lifeId, slug: lifeId,
    name: string(data.name, `${lifeId}.name`),
    subtitle: string(data.subtitle, `${lifeId}.subtitle`, ''),
    years: optionalString(data.years, `${lifeId}.years`),
    intro: string(data.intro, `${lifeId}.intro`, ''),
    description: string(data.description, `${lifeId}.description`, ''),
    hero, heroUrl: registerMedia(lifeDir, lifeId, hero, assets),
    heroAlt: string(data.heroAlt, `${lifeId}.heroAlt`),
    heroCaption: optionalString(data.heroCaption, `${lifeId}.heroCaption`),
    accent,
    theme: data.theme === undefined ? undefined : slug(data.theme, `${lifeId}.theme`),
    quote: optionalString(data.quote, `${lifeId}.quote`),
    quoteAttribution: optionalString(data.quoteAttribution, `${lifeId}.quoteAttribution`),
    facts: facts.map((entry, index) => {
      const fact = object(entry, `${lifeId}.facts[${index}]`);
      return { label: string(fact.label, `${lifeId}.facts[${index}].label`), value: string(fact.value, `${lifeId}.facts[${index}].value`) };
    }),
    // Only selected identities are passed to templates and serialized exports.
    storyOrder: orderedIds,
    stories,
  };
}

function load(options: ContentOptions = {}): { library: Library; assets: MediaAsset[] } {
  const root = path.resolve(options.contentRoot ?? path.join(process.cwd(), 'content'));
  const editionId = slug(options.edition ?? process.env.MLB_EDITION ?? 'demo', 'edition');
  const assets = new Map<string, MediaAsset>();
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) fail(root, 'content folder is missing');
  if (editionId === 'demo') {
    const livesRoot = checkedPath(root, path.join(root, 'lives'), 'directory', 'lives');
    const ids = fs.readdirSync(livesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => slug(entry.name, 'life folder')).sort();
    const lives = ids.map((id) => loadLife(root, id, undefined, assets));
    return { library: { edition: { id: 'demo', title: 'A few lives, beautifully kept.', description: 'Four fictional collections. A glimpse of what a life can hold.' }, lives }, assets: [...assets.values()] };
  }
  const editionsRoot = checkedPath(root, path.join(root, 'editions'), 'directory', 'editions');
  const filename = checkedPath(editionsRoot, path.join(editionsRoot, `${editionId}.json`), 'file', `edition ${editionId}`);
  const data = readJson(filename);
  if (slug(data.id, `${editionId}.id`) !== editionId) fail(editionId, 'id must match the edition filename');
  if (!Array.isArray(data.selections) || !data.selections.length) fail(editionId, 'selections must contain at least one life');
  const seen = new Set<string>();
  const lives = data.selections.map((entry, index) => {
    const selection = object(entry, `${editionId}.selections[${index}]`);
    const lifeId = slug(selection.life, `${editionId}.selections[${index}].life`);
    if (seen.has(lifeId)) fail(editionId, `duplicate life "${lifeId}"`);
    seen.add(lifeId);
    const stories = stringArray(selection.stories, `${editionId}.selections[${index}].stories`);
    if (!stories.length) fail(editionId, 'each selected life needs at least one story');
    return loadLife(root, lifeId, stories, assets);
  });
  return {
    library: { edition: { id: editionId, title: string(data.title, `${editionId}.title`), description: string(data.description, `${editionId}.description`, '') }, lives },
    assets: [...assets.values()],
  };
}

/** The only publishing boundary: private and unselected entries never reach templates. */
export function getLibrary(options: ContentOptions = {}): Library {
  return load(options).library;
}

/** Only referenced images from the selected edition, including inline Markdown images. */
export function getMediaAssets(options: ContentOptions = {}): MediaAsset[] {
  return load(options).assets;
}
