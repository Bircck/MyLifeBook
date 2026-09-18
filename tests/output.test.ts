import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import matter from 'gray-matter';

// These checks deliberately inspect finished files independently of getLibrary().
// Run npm run build, npm run build:edition -- ellen-remembrance, then npm run test:output.
const projectRoot = process.cwd();
const defaultRoot = path.join(projectRoot, 'dist');
const selectedRoot = path.join(defaultRoot, 'editions', 'ellen-remembrance');
const livesRoot = path.join(projectRoot, 'content', 'lives');
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'content/editions/ellen-remembrance.json'), 'utf8')) as { selections: { life: string; stories: string[] }[] };
const selectedKeys = new Set(manifest.selections.flatMap((selection) => selection.stories.map((id) => `${selection.life}/${id}`)));
const selectedLives = new Set(manifest.selections.map((selection) => selection.life));
const lives = fs.readdirSync(livesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => {
  const profile = JSON.parse(fs.readFileSync(path.join(livesRoot, entry.name, 'life.json'), 'utf8')) as { id: string; name: string };
  const stories = fs.readdirSync(path.join(livesRoot, entry.name, 'stories')).filter((filename) => filename.endsWith('.md')).map((filename) => {
    const parsed = matter(fs.readFileSync(path.join(livesRoot, entry.name, 'stories', filename), 'utf8'), { language: 'yaml' });
    return { lifeId: profile.id, id: parsed.data.id as string, title: parsed.data.title as string, access: parsed.data.access as string | undefined };
  });
  return { ...profile, stories };
});

type Artifact = { relative: string; bytes: Buffer };
function artifacts(root: string): Artifact[] {
  assert.ok(fs.existsSync(path.join(root, 'index.html')), `Missing built output ${root}. Build the default site, then ellen-remembrance, before running test:output.`);
  const files: Artifact[] = [];
  function visit(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      // The default distribution is inspected separately from sibling edition outputs.
      if (directory === defaultRoot && entry.name === 'editions') continue;
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      assert.ok(!entry.isSymbolicLink(), `Built output unexpectedly contains a symlink: ${relative}`);
      if (entry.isDirectory()) visit(absolute);
      else files.push({ relative, bytes: fs.readFileSync(absolute) });
    }
  }
  visit(root);
  return files;
}

function assertAbsent(files: Artifact[], tokens: string[]) {
  for (const file of files) {
    const text = file.bytes.toString('utf8').toLowerCase();
    for (const token of tokens) {
      assert.ok(!file.relative.toLowerCase().includes(token.toLowerCase()), `${file.relative} exposes an excluded identity in its filename: ${token}`);
      assert.ok(!text.includes(token.toLowerCase()), `${file.relative} contains excluded data: ${token}`);
    }
  }
}

function expectedHtml(selected: boolean): string[] {
  const result = ['index.html', '404.html', 'about/index.html', 'making/index.html', 'lives/index.html'];
  for (const life of lives) {
    if (selected && !selectedLives.has(life.id)) continue;
    const base = `lives/${life.id}`;
    result.push(`${base}/index.html`, `${base}/album/index.html`, `${base}/collection/index.html`, `${base}/print/index.html`);
    for (const story of life.stories) {
      if (story.access !== 'public' || (selected && !selectedKeys.has(`${life.id}/${story.id}`))) continue;
      result.push(`${base}/stories/${story.id}/index.html`);
    }
  }
  return result.sort();
}

const demoMedia = ['ellen-falk/coast.jpg', 'ellen-falk/garden.jpg', 'ellen-falk/sewing.jpg', 'ellen-falk/table.jpg', 'ellen-falk/travel.jpg', 'milo-chen/image.jpg', 'noor-rahman/image.jpg', 'sam-rivera/image.jpg'];
const selectedMedia = ['ellen-falk/coast.jpg', 'ellen-falk/sewing.jpg', 'ellen-falk/table.jpg'];

test('all generated default and selected artifacts exclude private story and asset canaries', () => {
  const forbidden = ['MYLIFEBOOK_PRIVATE_', 'a-letter-kept', 'private-letter.svg', 'A letter kept'];
  for (const root of [defaultRoot, selectedRoot]) assertAbsent(artifacts(root), forbidden);
});

test('selected output contains no excluded life, story, or exclusive image identity', () => {
  const excludedLives = lives.filter((life) => !selectedLives.has(life.id));
  const excludedStories = lives.flatMap((life) => life.stories).filter((story) => !selectedKeys.has(`${story.lifeId}/${story.id}`));
  const forbidden = [...excludedLives.flatMap((life) => [life.id, life.name]), ...excludedStories.flatMap((story) => [story.id, story.title]), 'garden.jpg', 'travel.jpg'];
  assertAbsent(artifacts(selectedRoot), forbidden);
});

test('HTML route inventories include exactly the public or selected identities', () => {
  for (const [root, selected] of [[defaultRoot, false], [selectedRoot, true]] as const) {
    const routes = artifacts(root).filter((file) => file.relative.endsWith('.html')).map((file) => file.relative).sort();
    assert.deepEqual(routes, expectedHtml(selected), `${root}: unexpected or missing published route`);
  }
});

test('media inventories contain exactly referenced fixture images, with unchanged bytes', () => {
  for (const [root, expected] of [[defaultRoot, demoMedia], [selectedRoot, selectedMedia]] as const) {
    const files = artifacts(root).filter((file) => file.relative.startsWith('media/'));
    assert.deepEqual(files.map((file) => file.relative.slice('media/'.length)).sort(), [...expected].sort());
    for (const file of files) {
      const [life, ...relative] = file.relative.slice('media/'.length).split('/');
      assert.deepEqual(file.bytes, fs.readFileSync(path.join(livesRoot, life, 'media', ...relative)), `${file.relative}: export changed the source image`);
    }
  }
});

test('no raw manuscripts, source maps, server bundles, or unreviewed export formats ship', () => {
  const permitted = new Set(['.html', '.css', '.js', '.svg', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.woff', '.woff2']);
  const publicFiles = fs.readdirSync(path.join(projectRoot, 'public')).sort();
  assert.deepEqual(publicFiles, ['favicon.svg', 'font-licenses.txt'], 'Review new public/ files: Astro copies them independently of edition selection');
  for (const root of [defaultRoot, selectedRoot]) {
    const files = artifacts(root);
    for (const file of files) {
      assert.ok(permitted.has(path.extname(file.relative)) || file.relative === 'font-licenses.txt', `Review new distribution artifact type: ${file.relative}`);
      assert.doesNotMatch(file.relative, /(?:^|\/)(?:originals|content|src|server|node_modules)(?:\/|$)/);
    }
    assertAbsent(files, [projectRoot, projectRoot.replaceAll('\\', '/'), 'sourceMappingURL=', 'node:fs', 'readFileSync(', 'MYLIFEBOOK_PRIVATE_']);
  }
});

test('selected search HTML and print content expose exactly the selected stories', () => {
  const files = artifacts(selectedRoot);
  const expectedSearchLinks = [...selectedKeys].map((key) => {
    const [life, story] = key.split('/');
    return `/lives/${life}/stories/${story}/`;
  }).sort();
  for (const file of files.filter((file) => file.relative.endsWith('.html'))) {
    const html = file.bytes.toString('utf8');
    if (html.includes('class="search-dialog"')) {
      const rows = [...html.matchAll(/<li\b(?=[^>]*\bdata-search-item\b)[^>]*>[\s\S]*?<\/li>/g)].map((match) => match[0]);
      const links = rows.map((row) => /href="([^"]+)"/.exec(row)?.[1]).sort();
      assert.deepEqual(links, expectedSearchLinks, `${file.relative}: search must match this edition`);
    }
  }
  for (const selection of manifest.selections) {
    const html = fs.readFileSync(path.join(selectedRoot, 'lives', selection.life, 'print/index.html'), 'utf8');
    const ids = [...html.matchAll(/data-print-id="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(ids, selection.stories, 'Printed stories must follow edition order');
    for (const id of selection.stories) {
      const story = lives.find((life) => life.id === selection.life)!.stories.find((story) => story.id === id)!;
      assert.ok(html.includes(story.title), `Print export omitted selected story ${id}`);
    }
  }
});

test('credits include exactly the photographs published in this edition', () => {
  for (const [root, expected] of [[defaultRoot, demoMedia], [selectedRoot, selectedMedia]] as const) {
    const html = fs.readFileSync(path.join(root, 'about/index.html'), 'utf8');
    const credits = [...html.matchAll(/<td>\s*<code>([^<]+)<\/code>\s*<\/td>/g)].map((match) => match[1]).sort();
    assert.deepEqual(credits, expected.map((asset) => asset.replace('/', '/media/')).sort());
  }
});

test('generated links, images, and CSS resources resolve inside each standalone output', () => {
  for (const root of [defaultRoot, selectedRoot]) {
    const files = artifacts(root);
    const names = new Set(files.map((file) => file.relative));
    for (const file of files.filter((file) => /\.(html|css)$/.test(file.relative))) {
      const text = file.bytes.toString('utf8');
      const references = file.relative.endsWith('.html')
        ? [...text.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1])
        : [...text.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/g)].map((match) => match[1]);
      const pageUrl = new URL(file.relative.endsWith('/index.html') ? file.relative.slice(0, -'index.html'.length) : file.relative, 'https://edition.test/');
      for (const reference of references) {
        const url = new URL(reference.replaceAll('&amp;', '&'), pageUrl);
        if (url.origin !== 'https://edition.test') continue;
        let target = decodeURIComponent(url.pathname).replace(/^\//, '');
        if (!target || target.endsWith('/')) target += 'index.html';
        assert.ok(names.has(target), `${file.relative}: broken internal reference ${reference} -> ${target}`);
        if (url.hash && target.endsWith('.html')) {
          const destination = fs.readFileSync(path.join(root, target), 'utf8');
          const id = decodeURIComponent(url.hash.slice(1));
          assert.ok(destination.includes(`id="${id}"`), `${file.relative}: missing anchor ${reference}`);
        }
      }
    }
  }
});
