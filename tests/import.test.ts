import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test, type TestContext } from 'node:test';
import { importSource } from '../scripts/import.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/imports/', import.meta.url));
const project = fileURLToPath(new URL('../', import.meta.url));

function setup(t: TestContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mylifebook-import-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const into = path.join(root, 'staging');
  const source = path.join(root, 'source');
  fs.mkdirSync(source);
  const write = (name: string, content: string | Buffer) => {
    const filename = path.join(source, name);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
    return filename;
  };
  const copy = (name: string) => write(name, fs.readFileSync(path.join(fixtures, name)));
  return { root, into, source, write, copy };
}

function readManifest(directory: string) {
  return JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
}

function snapshot(directory: string): Record<string, string> {
  return Object.fromEntries(fs.readdirSync(directory, { recursive: true })
    .map(String).filter((relative) => fs.statSync(path.join(directory, relative)).isFile())
    .map((relative) => [relative, fs.readFileSync(path.join(directory, relative)).toString('base64')]));
}

test('Markdown imports preserve exact source and local image bytes, with private candidate metadata', async (t) => {
  const f = setup(t);
  const input = f.copy('sample.md');
  f.copy('detail.png');
  const result = await importSource(input, { into: f.into, id: 'blue-tin' });
  assert.equal(result.status, 'imported');
  assert.deepEqual(fs.readFileSync(path.join(result.directory, result.originalPath)), fs.readFileSync(input));
  const story = fs.readFileSync(result.storyPath!, 'utf8');
  assert.match(story, /"access": "private"/);
  assert.match(story, /"title": "The blue tin"/);
  assert.match(story, /# The blue tin/);
  assert.match(story, /\*\*buttons\*\*/);
  assert.match(story, /https:\/\/example\.org\/source/);
  const manifest = readManifest(result.directory);
  const image = manifest.revisions[0].assets[0];
  assert.match(story, new RegExp(image.path.replace('.', '\\.')));
  assert.deepEqual(fs.readFileSync(path.join(result.directory, image.path)), fs.readFileSync(path.join(fixtures, 'detail.png')));
});

test('unchanged import leaves every staged file untouched and creates no duplicate version', async (t) => {
  const f = setup(t);
  const input = f.copy('sample.md');
  f.copy('detail.png');
  const first = await importSource(input, { into: f.into });
  const before = snapshot(first.directory);
  const second = await importSource(input, { into: f.into });
  assert.equal(second.status, 'unchanged');
  assert.equal(second.directory, first.directory);
  assert.deepEqual(snapshot(first.directory), before);
});

test('changed source refreshes an untouched candidate and retains all original versions', async (t) => {
  const f = setup(t);
  const input = f.write('memory.md', '# Memory\n\nThe first source wording.\n');
  const first = await importSource(input, { into: f.into, id: 'memory' });
  const oldOriginal = fs.readFileSync(path.join(first.directory, first.originalPath));
  f.write('memory.md', '# Memory\n\nThe corrected source wording.\n');
  const second = await importSource(input, { into: f.into, id: 'memory' });
  assert.equal(second.status, 'refreshed');
  assert.match(fs.readFileSync(second.storyPath!, 'utf8'), /corrected source wording/);
  assert.deepEqual(fs.readFileSync(path.join(first.directory, first.originalPath)), oldOriginal);
  assert.equal(readManifest(second.directory).revisions.length, 2);
});

test('edited story survives changed source and repeat import; review candidate is separate', async (t) => {
  const f = setup(t);
  const input = f.write('memory.md', '# Memory\n\nFirst source.\n');
  const first = await importSource(input, { into: f.into, id: 'memory' });
  const editorial = fs.readFileSync(first.storyPath!, 'utf8') + '\nMy own carefully edited ending.\n';
  fs.writeFileSync(first.storyPath!, editorial);
  f.write('memory.md', '# Memory\n\nChanged source.\n');
  const second = await importSource(input, { into: f.into, id: 'memory' });
  assert.equal(second.status, 'review-required');
  assert.equal(fs.readFileSync(first.storyPath!, 'utf8'), editorial);
  assert.match(fs.readFileSync(second.reviewPath!, 'utf8'), /Changed source/);
  const before = snapshot(second.directory);
  const third = await importSource(input, { into: f.into, id: 'memory' });
  assert.equal(third.status, 'unchanged');
  assert.deepEqual(snapshot(second.directory), before);
});

test('reverting to an earlier source version is treated as a change, not an unchanged import', async (t) => {
  const f = setup(t);
  const originalText = '# Memory\n\nThe first source.\n';
  const input = f.write('memory.md', originalText);
  const first = await importSource(input, { into: f.into, id: 'memory' });
  f.write('memory.md', '# Memory\n\nA newer source.\n');
  await importSource(input, { into: f.into, id: 'memory' });
  f.write('memory.md', originalText);
  const reverted = await importSource(input, { into: f.into, id: 'memory' });
  assert.equal(reverted.status, 'refreshed');
  assert.equal(reverted.sourceHash, first.sourceHash);
  assert.match(fs.readFileSync(reverted.storyPath!, 'utf8'), /The first source/);
  assert.equal(fs.readdirSync(path.join(first.directory, 'originals')).length, 2);
  assert.equal(readManifest(first.directory).revisions.length, 3);
});

test('manually accepting the latest candidate allows a later clean refresh', async (t) => {
  const f = setup(t);
  const input = f.write('memory.md', '# Memory\n\nFirst source.\n');
  const first = await importSource(input, { into: f.into, id: 'memory' });
  fs.appendFileSync(first.storyPath!, '\nAn edit.\n');
  f.write('memory.md', '# Memory\n\nSecond source.\n');
  const review = await importSource(input, { into: f.into, id: 'memory' });
  fs.copyFileSync(review.reviewPath!, first.storyPath!);
  f.write('memory.md', '# Memory\n\nThird source.\n');
  const third = await importSource(input, { into: f.into, id: 'memory' });
  assert.equal(third.status, 'refreshed');
  assert.match(fs.readFileSync(first.storyPath!, 'utf8'), /Third source/);
});

test('deleting a story counts as a local edit and is not silently undone', async (t) => {
  const f = setup(t);
  const input = f.write('memory.md', '# Memory\n\nFirst source.\n');
  const first = await importSource(input, { into: f.into, id: 'memory' });
  fs.unlinkSync(first.storyPath!);
  f.write('memory.md', '# Memory\n\nSecond source.\n');
  const result = await importSource(input, { into: f.into, id: 'memory' });
  assert.equal(result.status, 'review-required');
  assert.equal(result.storyPath, null);
  assert.ok(fs.existsSync(result.reviewPath!));
});

test('an image-only source change is recognized and old image bytes remain available', async (t) => {
  const f = setup(t);
  const input = f.copy('sample.md');
  const image = f.copy('detail.png');
  const first = await importSource(input, { into: f.into, id: 'memory' });
  const oldImage = readManifest(first.directory).revisions[0].assets[0].path;
  const oldBytes = fs.readFileSync(image);
  // A valid PNG may contain bytes following IEND; this changes the preserved image snapshot.
  fs.appendFileSync(image, Buffer.from('updated-source-attachment'));
  const second = await importSource(input, { into: f.into, id: 'memory' });
  assert.equal(second.sourceHash, first.sourceHash);
  assert.equal(second.status, 'refreshed');
  assert.deepEqual(fs.readFileSync(path.join(first.directory, oldImage)), oldBytes);
  assert.equal(readManifest(second.directory).revisions.length, 2);
});

test('safe links survive while active HTML, external images, and unsafe URLs are removed', async (t) => {
  const f = setup(t);
  const input = f.write('unsafe.md', `---\naccess: public\n---\n# Candidate\n\n[safe](https://example.org/read)\n\n[bad](javascript:alert%281%29)\n\n![Remote image](https://example.org/track.png)\n\n<img src="data:image/svg+xml,bad" onerror="alert(1)" />\n<script>window.BAD_CANARY = true</script>\n<iframe src="https://example.org/embed"></iframe>\n`);
  const result = await importSource(input, { into: f.into });
  const candidate = fs.readFileSync(result.storyPath!, 'utf8');
  assert.match(candidate, /\[safe\]\(https:\/\/example.org\/read\)/);
  assert.doesNotMatch(candidate, /javascript:|data:image|onerror|BAD_CANARY|<script|<iframe|example.org\/track/);
  assert.match(candidate, /"access": "private"/);
  assert.match(candidate, /Image omitted; review original/);
  assert.ok(result.warnings.some((message: string) => message.includes('external or unsafe')));
});

test('local image traversal, broken references, and symlink escapes are reported without reading outside source', async (t) => {
  const f = setup(t);
  fs.writeFileSync(path.join(f.root, 'secret.png'), fs.readFileSync(path.join(fixtures, 'detail.png')));
  fs.symlinkSync(f.root, path.join(f.source, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  const input = f.write('paths.md', '# Paths\n\n![Secret](../secret.png)\n\n![Encoded](%2e%2e/secret.png)\n\n![Linked](escape/secret.png)\n\n![Missing](absent.png)\n');
  const result = await importSource(input, { into: f.into });
  assert.equal(readManifest(result.directory).revisions[0].assets.length, 0);
  assert.ok(result.warnings.some((message: string) => message.includes('symlink or junction')));
  assert.ok(result.warnings.some((message: string) => message.includes('absent.png')));
});

test('unsupported source and broken DOCX are retained exactly with explicit reports', async (t) => {
  const f = setup(t);
  for (const [name, expected] of [['recording.bin', 'unsupported'], ['broken.docx', 'conversion-failed']] as const) {
    const bytes = Buffer.from([0, 255, 1, 24, 42, 0]);
    const input = f.write(name, bytes);
    const result = await importSource(input, { into: f.into });
    assert.equal(result.status, expected);
    assert.equal(result.storyPath, null);
    assert.deepEqual(fs.readFileSync(path.join(result.directory, result.originalPath)), bytes);
    assert.match(fs.readFileSync(result.reportPath!, 'utf8'), new RegExp(expected));
    assert.equal((await importSource(input, { into: f.into })).status, 'unchanged');
  }
});

test('non-UTF-8 Markdown is retained instead of silently replacing invalid bytes', async (t) => {
  const f = setup(t);
  const bytes = Buffer.from([35, 32, 255, 254, 10]);
  const result = await importSource(f.write('broken.md', bytes), { into: f.into });
  assert.equal(result.status, 'conversion-failed');
  assert.deepEqual(fs.readFileSync(path.join(result.directory, result.originalPath)), bytes);
});

test('real DOCX extracts headings, emphasis and original image bytes and sanitizes relationships', async (t) => {
  const f = setup(t);
  const input = f.copy('sample.docx');
  const result = await importSource(input, { into: f.into, id: 'docx-story' });
  assert.equal(result.status, 'imported', result.warnings.join('\n'));
  const story = fs.readFileSync(result.storyPath!, 'utf8');
  assert.match(story, /# The blue tin/);
  assert.match(story, /\*\*buttons\*\*/);
  assert.match(story, /Example source reference.*https:\/\/example\.org\/source/);
  assert.match(story, /Unsafe link label retained as text/);
  assert.doesNotMatch(story, /javascript:|alert\(1\)/);
  assert.match(story, /Figure 1 A fictional keepsake illustration/);
  assert.ok(result.warnings.some((message: string) => message.includes('Tables are flattened')));
  assert.ok(result.warnings.some((message: string) => message.includes('captions and dates are not inferred')));
  const asset = readManifest(result.directory).revisions[0].assets[0];
  assert.deepEqual(fs.readFileSync(path.join(result.directory, asset.path)), fs.readFileSync(path.join(fixtures, 'detail.png')));
  assert.deepEqual(fs.readFileSync(path.join(result.directory, result.originalPath)), fs.readFileSync(input));
});

test('ids, publishable destinations, and output symlinks cannot escape private staging', async (t) => {
  const f = setup(t);
  const input = f.write('story.md', '# Story');
  for (const id of ['../escape', 'two/parts', 'CON', 'nul', 'trailing-', 'x'.repeat(81)]) {
    await assert.rejects(importSource(input, { into: f.into, id }), /Import id/);
  }
  await assert.rejects(importSource(input, { into: path.join(project, 'public', 'imports') }), /private staging/);
  for (const id of ['public', 'content', 'src', 'dist', 'editions']) {
    await assert.rejects(importSource(input, { into: project, id }), /private staging/);
  }
  const outside = path.join(f.root, 'outside');
  fs.mkdirSync(outside);
  fs.mkdirSync(f.into);
  fs.symlinkSync(outside, path.join(f.into, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(importSource(input, { into: f.into, id: 'linked' }), /symlink or junction/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('same filename in different locations receives separate default identities', async (t) => {
  const f = setup(t);
  const first = await importSource(f.write('one/story.md', '# One'), { into: f.into });
  const second = await importSource(f.write('two/story.md', '# Two'), { into: f.into });
  assert.notEqual(first.id, second.id);
});

test('same bytes renamed from unsupported text to Markdown generate a candidate', async (t) => {
  const f = setup(t);
  const input = f.write('notes.txt', '# A supported story\n\nFictional prose.');
  const first = await importSource(input, { into: f.into, id: 'notes' });
  assert.equal(first.status, 'unsupported');
  const renamed = f.write('notes.md', fs.readFileSync(input));
  const second = await importSource(renamed, { into: f.into, id: 'notes' });
  assert.equal(second.status, 'review-required');
  assert.match(fs.readFileSync(second.reviewPath!, 'utf8'), /# A supported story/);
  assert.equal(readManifest(second.directory).revisions.length, 2);
});

test('modified original bytes are never silently replaced', async (t) => {
  const f = setup(t);
  const input = f.write('story.md', '# Story');
  const first = await importSource(input, { into: f.into });
  const original = path.join(first.directory, first.originalPath);
  fs.writeFileSync(original, 'a manually corrupted original');
  await assert.rejects(importSource(input, { into: f.into }), /Preserved original was modified/);
  assert.equal(fs.readFileSync(original, 'utf8'), 'a manually corrupted original');
});

test('CLI reports unsupported inputs with exit 2 while retaining them', (t) => {
  const f = setup(t);
  const input = f.write('notes.rtf', '{\\rtf1 Fictional notes}');
  const result = spawnSync(process.execPath, [path.join(project, 'scripts', 'import.mjs'), input, '--into', f.into, '--id', 'rtf-notes'], { encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stdout, /unsupported/);
  assert.ok(fs.existsSync(path.join(f.into, 'rtf-notes', 'manifest.json')));
});
