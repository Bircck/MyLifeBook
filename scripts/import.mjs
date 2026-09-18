#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import TurndownService from 'turndown';

const FORMAT_VERSION = 1;
const MAX_CONVERSION_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const SHA = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const warning = (messages, message) => { if (!messages.includes(message)) messages.push(message); };

function hashFile(filename) {
  return new Promise((resolve, reject) => {
    const digest = crypto.createHash('sha256');
    const stream = fs.createReadStream(filename);
    stream.on('data', (chunk) => digest.update(chunk));
    stream.on('end', () => resolve(digest.digest('hex')));
    stream.on('error', reject);
  });
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function noSymlinks(target) {
  const absolute = path.resolve(target);
  const { root } = path.parse(absolute);
  let cursor = root;
  for (const segment of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    try {
      if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Refusing symlink or junction in import path: ${cursor}`);
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
  return absolute;
}

function safePath(root, relative) {
  const target = path.resolve(root, relative);
  if (!inside(root, target)) throw new Error('Import path escapes its destination.');
  return noSymlinks(target);
}

function immutableWrite(root, relative, bytes) {
  const destination = safePath(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  try {
    fs.writeFileSync(destination, bytes, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!fs.statSync(destination).isFile() || hash(fs.readFileSync(destination)) !== hash(bytes)) {
      throw new Error(`Preserved file was modified; refusing to overwrite ${relative}.`);
    }
  }
}

function atomicWrite(root, relative, bytes) {
  const destination = safePath(root, relative);
  const temporary = safePath(root, `.writing-${crypto.randomUUID()}`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, destination);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function loadManifest(root, id) {
  const manifestPath = safePath(root, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
  catch { throw new Error('Cannot read existing manifest.json; preserving it for manual review.'); }
  if (manifest.version !== FORMAT_VERSION || manifest.id !== id || !Array.isArray(manifest.revisions)
      || !manifest.revisions.every((revision) => SHA.test(revision.sourceHash) && SHA.test(revision.revisionHash)
        && (revision.storyHash === null || SHA.test(revision.storyHash)))
      || (manifest.installedStoryHash !== null && !SHA.test(manifest.installedStoryHash))) {
    throw new Error('Existing import manifest is invalid or uses an unsupported version.');
  }
  return manifest;
}

function imageExtension(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (/^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii'))) return 'gif';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (bytes.subarray(4, 8).toString('ascii') === 'ftyp' && /^(avif|avis)$/.test(bytes.subarray(8, 12).toString('ascii'))) return 'avif';
  return null;
}

function safeLink(href) {
  if (typeof href !== 'string' || /[\u0000-\u0020\u007f\\]/.test(href)) return false;
  if (/^#[a-zA-Z0-9_-]+$/.test(href)) return true;
  try {
    const url = new URL(href);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

function convertDocx(bytes) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { mode: 'convert-docx', bytes },
      resourceLimits: { maxOldGenerationSizeMb: 256 },
    });
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error('DOCX conversion exceeded 30 seconds; the original is retained.'));
    }, 30_000);
    worker.once('message', (result) => {
      clearTimeout(timer);
      if (result.error) reject(new Error(result.error));
      else resolve(result);
    });
    worker.once('error', (error) => { clearTimeout(timer); reject(error); });
    worker.once('exit', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`DOCX conversion stopped (worker exit ${code}).`));
    });
  });
}

async function convert(bytes, extension, sourcePath, importRoot, messages) {
  let html;
  let extracted = [];
  if (extension === '.docx') {
    const result = await convertDocx(bytes);
    html = result.html;
    extracted = result.images;
    for (const message of result.messages) warning(messages, `DOCX: ${message.message}`);
    warning(messages, 'DOCX layout is not reproduced. Review headers, footers, comments, tracked changes, text boxes, equations, notes, and reading order against the original.');
    warning(messages, 'Image captions and dates are not inferred. Review image placement and alt text before publication.');
  } else {
    let markdown = new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
    const frontmatter = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
    if (frontmatter.test(markdown)) {
      markdown = markdown.replace(frontmatter, '');
      warning(messages, 'Existing frontmatter is preserved only in the original. Candidate metadata is private and requires review.');
    }
    if (/\[\[|!\[\[/.test(markdown)) warning(messages, 'Wiki links and embeds are not resolved. Review them against the original.');
    html = await marked.parse(markdown, { async: true });
    warning(messages, 'Markdown formatting is normalized. Relative document links and unsupported embedded content require review against the original.');
  }

  const assets = [];
  const imageCache = new Map();
  function preserveImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    let imageBytes;
    if (extension === '.docx' && /^mlb-image-\d+$/.test(src)) {
      const entry = extracted[Number(src.slice(10))];
      if (entry) imageBytes = Buffer.from(entry.bytes);
    } else if (extension !== '.docx') {
      let relative;
      try { relative = decodeURIComponent(src); } catch { relative = ''; }
      if (!relative || /[\u0000-\u001f\u007f?#:]/.test(relative) || relative.startsWith('/')
          || relative.includes('\\') || relative.split('/').includes('..') || path.isAbsolute(relative)) {
        warning(messages, `Image reference omitted (external or unsafe path): ${src}`);
        return null;
      }
      try {
        const imagePath = safePath(path.dirname(sourcePath), relative);
        if (!fs.statSync(imagePath).isFile()) throw new Error('not a regular file');
        if (fs.statSync(imagePath).size > MAX_IMAGE_BYTES) throw new Error('larger than 15 MB');
        imageBytes = fs.readFileSync(imagePath);
      } catch (error) {
        warning(messages, `Image reference unavailable: ${src} (${error.message})`);
        return null;
      }
    }
    if (!imageBytes) {
      warning(messages, `Image reference could not be extracted: ${src}`);
      return null;
    }
    const imageHash = hash(imageBytes);
    const type = imageExtension(imageBytes);
    const destination = type ? `media/${imageHash}.${type}` : `originals/attachments/${imageHash}.bin`;
    immutableWrite(importRoot, destination, imageBytes);
    assets.push({ source: src, sha256: imageHash, path: destination, supported: Boolean(type), bytes: imageBytes.length });
    imageCache.set(src, type ? destination : null);
    if (!type) warning(messages, `Unsupported image retained as inert bytes, omitted from candidate: ${src}`);
    return type ? destination : null;
  }

  const clean = sanitizeHtml(html, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 's', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code', 'hr', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub'],
    allowedAttributes: { a: ['href', 'id'], img: ['src', 'alt'], ol: ['start'], sup: ['id'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => {
        const safe = safeLink(attributes.href);
        if (attributes.href && !safe) warning(messages, `Link destination omitted (unsafe or unresolved): ${attributes.href}`);
        return { tagName, attribs: safe ? { href: attributes.href } : {} };
      },
      img: (tagName, attributes) => {
        const src = preserveImage(attributes.src || '');
        if (!attributes.alt?.trim()) warning(messages, 'An image has no alt text. Add an accurate description before publication.');
        return { tagName, attribs: { ...(src ? { src } : {}), alt: attributes.alt || '' } };
      },
    },
  });
  if (/<(?:script|iframe|object|embed|style|form|svg|video|audio)\b|\son[a-z]+\s*=|\sstyle\s*=/i.test(html)) {
    warning(messages, 'Active HTML, media embeds, styles, or event attributes were omitted from the candidate. The original remains unchanged.');
  }
  const markdown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  markdown.addRule('unavailableImage', {
    filter: (node) => node.nodeName === 'IMG' && !node.getAttribute('src'),
    replacement: (_content, node) => `[Image omitted; review original${node.getAttribute('alt') ? `: ${node.getAttribute('alt').replace(/[\[\]<>]/g, '')}` : ''}]`,
  });
  markdown.addRule('tableCells', { filter: ['th', 'td'], replacement: (content) => `${content.trim()} | ` });
  markdown.addRule('tableRows', { filter: 'tr', replacement: (content) => `\n${content.trim()}\n` });
  if (/<table\b/.test(clean)) warning(messages, 'Tables are flattened into separated text rows; review their structure and meaning.');
  const firstHeading = /<h[12]>([\s\S]*?)<\/h[12]>/.exec(clean);
  const title = firstHeading ? markdown.turndown(firstHeading[1]).replace(/[\r\n]/g, ' ').trim() : path.basename(sourcePath, extension);
  return { body: markdown.turndown(clean).trim(), title: title || 'Imported story', assets };
}

/** Imports into a private staging directory; never adds or selects published content. */
export async function importSource(source, options = {}) {
  const sourcePath = path.resolve(source);
  const sourceStat = fs.statSync(sourcePath);
  if (!sourceStat.isFile()) throw new Error('Import source must be a regular file.');
  const destination = noSymlinks(path.resolve(options.into || 'imports'));
  for (const published of ['public', 'content', 'src', 'dist', 'editions']) {
    if (inside(path.join(projectRoot, published), destination)) throw new Error('Choose a private staging folder outside public, content, src, dist, and editions.');
  }
  const base = path.basename(sourcePath, path.extname(sourcePath)).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55).replace(/-$/, '') || 'source';
  const id = options.id ?? `${base}-${hash(Buffer.from(sourcePath)).slice(0, 8)}`;
  if (typeof id !== 'string' || id.length > 80 || !ID.test(id) || RESERVED.test(id)) throw new Error('Import id must use lowercase letters, numbers, and single hyphens (maximum 80), excluding reserved filenames.');
  const directory = safePath(destination, id);
  for (const published of ['public', 'content', 'src', 'dist', 'editions']) {
    if (inside(path.join(projectRoot, published), directory)) throw new Error('Choose a private staging folder outside public, content, src, dist, and editions.');
  }
  fs.mkdirSync(directory, { recursive: true });
  const lockPath = safePath(directory, '.import.lock');
  let lock;
  try { lock = fs.openSync(lockPath, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another import may be running. Inspect .import.lock before removing a stale lock.');
    throw error;
  }
  const temporarySource = safePath(directory, `.source-${crypto.randomUUID()}`);
  try {
    const manifest = loadManifest(directory, id) || { version: FORMAT_VERSION, id, installedStoryHash: null, revisions: [] };
    const storyPath = safePath(directory, 'story.md');
    const currentStoryHash = fs.existsSync(storyPath) ? hash(fs.readFileSync(storyPath)) : null;
    // Copy first, then hash and convert that exact snapshot even if the input changes later.
    fs.copyFileSync(sourcePath, temporarySource, fs.constants.COPYFILE_EXCL);
    const sourceHash = await hashFile(temporarySource);
    const extension = path.extname(sourcePath).toLowerCase();
    const supported = ['.md', '.markdown', '.docx'].includes(extension);
    const originalPath = `originals/${sourceHash}${supported ? extension : '.bin'}`;
    const preservedPath = safePath(directory, originalPath);
    fs.mkdirSync(path.dirname(preservedPath), { recursive: true });
    if (fs.existsSync(preservedPath)) {
      const storedHash = await hashFile(preservedPath);
      if (storedHash !== sourceHash) throw new Error('Preserved original was modified; refusing to overwrite it.');
    } else {
      fs.copyFileSync(temporarySource, preservedPath, fs.constants.COPYFILE_EXCL);
      fs.chmodSync(preservedPath, 0o600);
    }
    const messages = [];
    let converted = null;
    let state = 'imported';
    if (!supported) {
      state = 'unsupported';
      warning(messages, `Unsupported source format ${extension || '(no extension)'}. Original bytes are retained; no story was generated.`);
    } else if (fs.statSync(preservedPath).size > MAX_CONVERSION_BYTES) {
      state = 'unsupported';
      warning(messages, 'Source exceeds the 25 MB conversion limit. Original bytes are retained; no story was generated.');
    } else {
      try { converted = await convert(fs.readFileSync(preservedPath), extension, sourcePath, directory, messages); }
      catch (error) {
        state = 'conversion-failed';
        warning(messages, `Conversion failed: ${error.message}. Original bytes are retained; no story was generated.`);
      }
    }
    const revisionHash = hash(Buffer.from(JSON.stringify({ sourceHash, sourceName: path.basename(sourcePath), extension,
      conversion: converted ? { title: converted.title, body: converted.body, assets: converted.assets } : null, state })));
    const previous = manifest.revisions.at(-1);
    if (previous?.revisionHash === revisionHash) {
      return { id, directory, status: 'unchanged', sourceHash, originalPath, warnings: previous.warnings,
        previousStatus: previous.status, storyPath: currentStoryHash ? storyPath : null,
        reviewPath: previous.reviewFile ? safePath(directory, previous.reviewFile) : null };
    }
    let story = null;
    let reviewFile = null;
    if (converted) {
      const frontmatter = { id, title: converted.title, access: 'private',
        source: { label: path.basename(sourcePath), type: extension === '.docx' ? 'DOCX import' : 'Markdown import', treatment: 'Imported candidate; review against preserved original.' },
        importedFrom: { original: originalPath, sha256: sourceHash } };
      story = `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${converted.body}\n`;
      const latestCandidate = manifest.revisions.at(-1)?.storyHash;
      const cleanStory = currentStoryHash !== null && (currentStoryHash === manifest.installedStoryHash || currentStoryHash === latestCandidate);
      if ((!manifest.revisions.length && currentStoryHash === null) || cleanStory) {
        state = manifest.revisions.length ? 'refreshed' : 'imported';
        atomicWrite(directory, 'story.md', story);
        manifest.installedStoryHash = hash(Buffer.from(story));
      } else {
        state = 'review-required';
        reviewFile = `review-${revisionHash}.md`;
        immutableWrite(directory, reviewFile, Buffer.from(story));
        warning(messages, 'story.md has local changes or was removed. It was preserved; compare the review candidate manually.');
      }
    }
    const record = { sourceName: path.basename(sourcePath), sourceHash, revisionHash, originalPath,
      importedAt: new Date().toISOString(), status: state, storyHash: story === null ? null : hash(Buffer.from(story)),
      reviewFile, assets: converted?.assets || [], warnings: messages };
    const reportFile = `reports/${String(manifest.revisions.length + 1).padStart(4, '0')}-${revisionHash}.json`;
    immutableWrite(directory, reportFile, Buffer.from(`${JSON.stringify(record, null, 2)}\n`));
    manifest.revisions.push(record);
    atomicWrite(directory, 'manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
    return { id, directory, status: state, sourceHash, originalPath, warnings: messages,
      storyPath: fs.existsSync(storyPath) ? storyPath : null,
      reviewPath: reviewFile ? safePath(directory, reviewFile) : null, reportPath: safePath(directory, reportFile) };
  } finally {
    if (fs.existsSync(temporarySource)) fs.unlinkSync(temporarySource);
    fs.closeSync(lock);
    fs.unlinkSync(lockPath);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help')) {
    console.log('Usage: npm run import -- <file.md|file.docx|other-file> [--into <private-directory>] [--id <stable-id>]\nDefault destination: imports/. No imported content is published.');
    return;
  }
  const source = args.shift();
  const options = {};
  while (args.length) {
    const flag = args.shift();
    if (!['--into', '--id'].includes(flag) || !args.length || args[0].startsWith('--')) throw new Error(`Unknown or incomplete argument: ${flag}`);
    const key = flag.slice(2);
    if (options[key] !== undefined) throw new Error(`Duplicate argument: ${flag}`);
    options[key] = args.shift();
  }
  const result = await importSource(source, options);
  console.log(`${result.status}: ${result.directory}`);
  if (result.reviewPath) console.log(`Review candidate: ${result.reviewPath}`);
  for (const message of result.warnings) console.log(`- ${message}`);
  console.log('Original retained. Imported content remains unpublished.');
  if (['unsupported', 'conversion-failed'].includes(result.status) || ['unsupported', 'conversion-failed'].includes(result.previousStatus)) process.exitCode = 2;
}

if (!isMainThread && workerData?.mode === 'convert-docx') {
  try {
    const { default: mammoth } = await import('mammoth');
    const images = [];
    let imageBytes = 0;
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(workerData.bytes) }, {
      externalFileAccess: false,
      includeEmbeddedStyleMap: false,
      styleMap: ["p[style-name='Title'] => h1:fresh"],
      convertImage: mammoth.images.imgElement(async (image) => {
        const bytes = await image.readAsBuffer();
        imageBytes += bytes.length;
        if (bytes.length > MAX_IMAGE_BYTES || imageBytes > 50 * 1024 * 1024) throw new Error('Embedded images exceed the conversion size limit.');
        const src = `mlb-image-${images.length}`;
        images.push({ bytes, contentType: image.contentType });
        return { src };
      }),
    });
    parentPort.postMessage({ html: result.value, messages: result.messages.map(({ type, message }) => ({ type, message })), images });
  } catch (error) { parentPort.postMessage({ error: error.message }); }
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`Import failed: ${error.message}`); process.exitCode = 1; });
}
