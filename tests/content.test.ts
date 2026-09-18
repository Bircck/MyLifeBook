import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, type TestContext } from 'node:test';
import { getLibrary, getMediaAssets } from '../src/lib/content.ts';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3y8AAAAASUVORK5CYII=', 'base64');

function fixture(t: TestContext) {
  const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mylifebook-content-'));
  t.after(() => fs.rmSync(contentRoot, { recursive: true, force: true }));
  function write(relative: string, value: string | Buffer) {
    const filename = path.join(contentRoot, relative);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, value);
  }
  function json(relative: string, value: unknown) { write(relative, JSON.stringify(value, null, 2)); }
  function story(id: string, data: Record<string, unknown> = {}, body = `The public story of ${id}.`, life = 'example-life') {
    // JSON is a YAML subset and avoids accidental YAML timestamp conversion in fixtures.
    write(`lives/${life}/stories/${id}.md`, `---\n${JSON.stringify({ id, title: id, access: 'public', ...data })}\n---\n${body}\n`);
  }
  function life(id = 'example-life') {
    json(`lives/${id}/life.json`, { id, name: 'An Invented Person', hero: 'cover.png', heroAlt: 'An invented garden', facts: [{ label: 'Collection', value: 'Fictional' }], storyOrder: ['first-story', 'second-story'] });
    for (const file of ['cover.png', 'first.png', 'second.png', 'inline.png', 'unreferenced.png']) write(`lives/${id}/media/${file}`, PNG);
    story('first-story', { image: 'first.png', imageAlt: 'The first photograph' }, 'The first story.', id);
    story('second-story', { image: 'second.png', imageAlt: 'The second photograph' }, 'The second story.', id);
    story('private-story', { access: 'private', image: 'private.svg', imageAlt: 'PRIVATE_IMAGE_ALT_CANARY' }, 'PRIVATE_STORY_CANARY', id);
    write(`lives/${id}/media/private.svg`, '<svg>PRIVATE_ASSET_CANARY</svg>');
  }
  function edition(stories = ['first-story'], name = 'selected') {
    json(`editions/${name}.json`, { id: name, title: 'A Selected Collection', description: 'For sharing', selections: [{ life: 'example-life', stories }] });
  }
  life();
  edition();
  return { contentRoot, write, json, story, life, edition };
}

test('demo excludes private story data and unreferenced media at the publishing boundary', (t) => {
  const { contentRoot } = fixture(t);
  const library = getLibrary({ contentRoot, edition: 'demo' });
  assert.deepEqual(library.lives[0].stories.map((story) => story.id), ['first-story', 'second-story']);
  assert.doesNotMatch(JSON.stringify(library), /PRIVATE_|private-story|private\.svg/);
  assert.deepEqual(getMediaAssets({ contentRoot, edition: 'demo' }).map((asset) => asset.routePath).sort(), ['example-life/cover.png', 'example-life/first.png', 'example-life/second.png']);
});

test('edition exports only named lives, stories, and their referenced media', (t) => {
  const f = fixture(t);
  f.life('another-life');
  const library = getLibrary({ contentRoot: f.contentRoot, edition: 'selected' });
  assert.deepEqual(library.lives.map((life) => life.id), ['example-life']);
  assert.deepEqual(library.lives[0].storyOrder, ['first-story']);
  assert.deepEqual(library.lives[0].stories.map((story) => story.id), ['first-story']);
  assert.doesNotMatch(JSON.stringify(library), /second-story|another-life|PRIVATE_/);
  assert.deepEqual(getMediaAssets({ contentRoot: f.contentRoot, edition: 'selected' }).map((asset) => asset.routePath).sort(), ['example-life/cover.png', 'example-life/first.png']);
});

test('creator edition order overrides the life order', (t) => {
  const f = fixture(t);
  f.edition(['second-story', 'first-story']);
  assert.deepEqual(getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }).lives[0].stories.map((story) => story.id), ['second-story', 'first-story']);
});

test('private entries cannot be selected, and missing access defaults to private', (t) => {
  const f = fixture(t);
  f.story('unclassified', { access: undefined }, 'UNCLASSIFIED_CANARY');
  assert.doesNotMatch(JSON.stringify(getLibrary({ contentRoot: f.contentRoot, edition: 'demo' })), /UNCLASSIFIED_CANARY/);
  for (const id of ['private-story', 'unclassified']) {
    f.edition([id]);
    assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /cannot publish private story/);
  }
});

test('missing references fail with a useful error instead of silently changing selection', (t) => {
  const f = fixture(t);
  f.edition(['missing-story']);
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /missing story "missing-story"/);
  f.edition();
  f.story('first-story', { image: 'missing.png', imageAlt: 'Missing image' });
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /missing file/);
});

test('duplicate entries and mismatched identities fail', (t) => {
  const f = fixture(t);
  f.edition(['first-story', 'first-story']);
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /duplicate entries/);
  f.edition();
  f.story('first-story', { id: 'wrong-id' });
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /id must match/);
});

test('edition names and media cannot traverse outside owning folders', (t) => {
  const f = fixture(t);
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: '../selected' }), /edition/);
  for (const image of ['../private.png', 'C:\\secret.png', '/secret.png', 'https://example.com/photo.png', '%2e%2e/secret.png', 'nested/../secret.png']) {
    f.story('first-story', { image, imageAlt: 'Traversal attempt' });
    assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /relative filename inside/);
  }
});

test('a media symlink cannot escape the owning folder', (t) => {
  const f = fixture(t);
  const outside = path.join(f.contentRoot, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'secret.png'), PNG);
  try {
    fs.symlinkSync(outside, path.join(f.contentRoot, 'lives/example-life/media/linked'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EPERM') { t.skip('This host does not permit symlink creation'); return; }
    throw error;
  }
  f.story('first-story', { image: 'linked/secret.png', imageAlt: 'Outside image' });
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /symlink escapes/);
});

test('unsupported or falsely named image formats fail closed', (t) => {
  const f = fixture(t);
  f.story('first-story', { image: 'private.svg', imageAlt: 'SVG image' });
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /unsupported media format/);
  f.write('lives/example-life/media/disguised.jpg', '<svg onload="alert(1)"></svg>');
  f.story('first-story', { image: 'disguised.jpg', imageAlt: 'Disguised image' });
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /does not match its image extension/);
});

test('inline images are tracked and dangerous raw HTML is removed', (t) => {
  const f = fixture(t);
  f.story('first-story', {}, '# A heading\n\n![A remembered garden](media/inline.png)\n\n<script>alert("XSS")</script><iframe src="https://example.com"></iframe><p onclick="alert(1)">Safe words</p>');
  const library = getLibrary({ contentRoot: f.contentRoot, edition: 'selected' });
  const html = library.lives[0].stories[0].html;
  assert.match(html, /src="\/media\/example-life\/inline.png"/);
  assert.match(html, /Safe words/);
  assert.doesNotMatch(html, /script|iframe|onclick|alert|XSS/);
  assert.deepEqual(getMediaAssets({ contentRoot: f.contentRoot, edition: 'selected' }).map((asset) => asset.routePath).sort(), ['example-life/cover.png', 'example-life/inline.png']);
});

test('inline images need alt text and cannot load remote content', (t) => {
  const f = fixture(t);
  f.story('first-story', {}, '![](inline.png)');
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /descriptive alt text/);
  f.story('first-story', {}, '![Remote image](https://example.com/tracking.png)');
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /relative filename inside/);
});

test('story links resolve only to stories in this edition', (t) => {
  const f = fixture(t);
  f.story('first-story', {}, '[Read on](story:second-story)');
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /missing or excluded story/);
  f.edition(['first-story', 'second-story']);
  assert.match(getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }).lives[0].stories[0].html, /href="\/lives\/example-life\/stories\/second-story\/"/);
});

test('arbitrary local source links and executable URLs fail visibly', (t) => {
  const f = fixture(t);
  for (const link of ['../originals/private.txt', 'javascript:alert', 'data:text/html,secret']) {
    f.story('first-story', {}, `[A link](${link})`);
    assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /unsupported link/);
  }
});

test('executable frontmatter is rejected before parser engine dispatch', (t) => {
  const f = fixture(t);
  f.write('lives/example-life/stories/first-story.md', '---javascript\n{ id: "first-story", title: "Must not execute", access: "public", marker: (() => { throw new Error("ENGINE_EXECUTED") })() }\n---\nText');
  assert.throws(() => getLibrary({ contentRoot: f.contentRoot, edition: 'selected' }), /plain --- line and YAML frontmatter/);
});

test('reading and publishing leave manuscript bytes and originals unchanged', (t) => {
  const f = fixture(t);
  f.write('lives/example-life/originals/notes.txt', 'An original note, exactly as received.\r\n');
  const manuscript = path.join(f.contentRoot, 'lives/example-life/stories/first-story.md');
  const original = path.join(f.contentRoot, 'lives/example-life/originals/notes.txt');
  const before = [fs.readFileSync(manuscript), fs.readFileSync(original)];
  getLibrary({ contentRoot: f.contentRoot, edition: 'demo' });
  getMediaAssets({ contentRoot: f.contentRoot, edition: 'selected' });
  assert.deepEqual(fs.readFileSync(manuscript), before[0]);
  assert.deepEqual(fs.readFileSync(original), before[1]);
});
