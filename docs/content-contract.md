# Portable content and selected editions

Implemented 2026-09-19 as a bounded first publishing format. This is a project implementation choice, not a requirement that every contributor write Markdown. Ordinary files remain the source of truth; an editor or an external agent can help prepare them. There is no database or document editor.

## Folder layout

```text
content/
  lives/
    example-person/
      life.json
      stories/
        a-small-memory.md
        another-memory.md
      media/
        portrait.jpg
        garden.jpg
      originals/              # Optional source preservation; never published
  editions/
    a-small-collection.json
```

Life folder names, story filenames, and edition filenames use lowercase letters, numbers, and single hyphens. Their `id` must match the folder or filename. Stable IDs keep URLs predictable when titles change. Every life needs a `stories` folder. Other source formats can be retained under `originals`; this loader does not interpret them or publish them.

All repository examples are fiction. Keep real personal content in a private copy or separate content directory. A public Git repository exposes its source files independently of which edition the website publishes.

## A life

```json
{
  "id": "example-person",
  "name": "An Invented Person",
  "subtitle": "A collection of small adventures",
  "years": "A life in progress",
  "intro": "A short introduction in the creator's own voice.",
  "description": "A short description for cards and page metadata.",
  "hero": "portrait.jpg",
  "heroAlt": "A fictional person standing beside a garden gate",
  "heroCaption": "An illustration of the collection's setting.",
  "accent": "#536a51",
  "theme": "sage",
  "quote": "There was always room for one more chair.",
  "quoteAttribution": "From this fictional collection",
  "facts": [{ "label": "A favorite place", "value": "The garden" }],
  "storyOrder": ["a-small-memory", "another-memory"]
}
```

Required: `id`, `name`, `hero`, `heroAlt`. The other fields are optional. `facts` and `storyOrder` default to empty lists; subtitle, introduction, and description default to empty text. `accent` accepts a three- or six-digit hex color. `theme` is an optional slug for presentation. The theme names a visual treatment; it does not impose a life stage.

`storyOrder` chooses an order; it does not choose publication access. Any other public stories follow alphabetically by filename. Dates, chapters, age ranges, and a particular number of facts are not required.

**Profile information is shared with every edition containing this life.** This includes the name, introduction, facts, quote, hero, captions, and description. Put material requiring separate selection in a story; do not put private information in the shared profile.

## A story

```markdown
---
id: a-small-memory
title: A table in the garden
excerpt: The afternoon that became a family tradition.
category: Small rituals
date: "One summer afternoon"
year: 1994
access: public
image: garden.jpg
imageAlt: A table laid for lunch beneath a tree
imageCaption: An illustration, not a photograph of a real event.
source:
  label: Fictional demonstration manuscript
  type: original
  treatment: Composed fiction; no real person's history is represented.
---

The story starts here, in ordinary **Markdown**.

> A remembered sentence can have its own space.
```

Required: `id`, `title`. **Publication requires an explicit `access: public`.** Missing access is treated as `private`. `private` marks an unpublished draft; it is not a password-protected page. Neither the default website nor a selected edition publishes private stories.

`excerpt`, `category`, `date`, `year`, `image`, `imageAlt`, `imageCaption`, and `source` are optional. `imageAlt` is required when an image is specified. Quote textual dates in YAML; `year`, when supplied, is an integer. No timeline or chronological sequence is required.

If provided, `source` has three plain-text fields: `label`, `type`, and `treatment`. These distinguish such things as an original manuscript, verbatim transcript, edited summary, or fictional example. The creator chooses the treatment. Attribution text is displayed; this loader never rewrites source material and never invents an attribution. A source filename is not automatically published or linked.

Use a bare `---` opening line for YAML frontmatter. Executable frontmatter engines are rejected. Raw HTML is sanitized: scripts, embedded frames, event handlers, and unsafe attributes are removed. Supported Markdown includes paragraphs, headings, emphasis, quotes, lists, and tables.

An inline image can use `![Description](garden.jpg)` or `![Description](media/garden.jpg)`. Every inline image needs descriptive alt text. The image must belong to the same life. Remote images, data URLs, unsupported formats, missing images, and escaped paths fail the build with an error.

Links support `https:`, `http:`, `mailto:`, page `#anchors`, and `[Another memory](story:another-memory)`. A story link must name another story in the same life and selected edition. Missing or excluded story links fail visibly. Arbitrary local file links are rejected so original files are not accidentally linked from published prose.

## Images and preservation

Supported image files: JPG/JPEG, PNG, WebP, GIF, and AVIF. The loader checks their file signatures as well as extensions. SVG, audio, video, embedded document media, and remote media are not handled by this loader. Keep unsupported originals separately until a format-specific workflow exists.

Images can be nested within `media/`. A reference may contain spaces; generated URL segments are encoded. Traversal, absolute paths, encoded path escapes, and symlinks escaping an owning folder are rejected. Images are exported only when a selected profile or selected story references them, including inline images. There is no separate per-image access flag: referencing an image from published content authorizes its inclusion in that edition.

Do not put personal content in Astro's `public/` folder. Astro copies that folder independently of this selection boundary. The application serves the loader's explicit image list through its media route instead.

## Select and build a collection

`content/editions/a-small-collection.json`:

```json
{
  "id": "a-small-collection",
  "title": "An afternoon to remember",
  "description": "A small selection for friends.",
  "selections": [
    { "life": "example-person", "stories": ["a-small-memory"] }
  ]
}
```

The order of `selections` controls life order. The story list controls story order and overrides `storyOrder`. Repeated lives, repeated stories, empty selections, missing identities, or private stories fail the build. A collection includes the selected life's shared profile and hero in addition to its chosen stories.

```sh
npm run dev
npm run build
npm run build:edition -- a-small-collection
```

The default `demo` edition includes every public story from every life. `demo` is reserved and does not read an edition JSON file. A selected build goes into `dist/editions/a-small-collection/`. Publish or distribute that exact folder, rather than the parent `dist/` folder. The default build uses `dist/`; rebuilding the default may remove previously generated editions beneath it. These are regenerated outputs, not manuscripts.

`MLB_EDITION` also chooses an edition for direct Astro commands, including local preview development. The wrapper script sets it portably on Windows and other platforms. A selected static website is public to anyone who can access its URL. Protected family delivery, passwords, revocation, and accounts remain separate work; selection does not claim to provide them.

## Publishing API and evidence

`src/lib/content.ts` exports synchronous `getLibrary({ contentRoot?, edition? })` and `getMediaAssets({ contentRoot?, edition? })`. The root defaults to `content/`; the edition defaults to `MLB_EDITION` or `demo`. Templates consume the selected library. The media route consumes the selected asset list. No raw content folder is copied into the output.

The library exposes selected lives and stories only. Generated fields include `heroUrl`, story `imageUrl`, sanitized story `html`, and estimated `readingMinutes` at 200 words per minute. Source paths are not included. Each media asset has a public `url`, an unencoded route `routePath`, a local `absolutePath`, and a validated `mime`.

Run `npm test` for targeted checks of selected identities and assets, private defaults, order preservation, broken references, traversal and symlink rejection, unsupported media, sanitization, executable-frontmatter rejection, and unchanged manuscript/original bytes. Whole-build output checks are also necessary when adding routes, feeds, search indexes, or exports; loader tests alone cannot certify every generated artifact.
