# MyLifeBook

**A home for the stories that make a life.**

MyLifeBook turns ordinary text files and photographs into a personal life website. Collect small memories, tell longer stories, arrange them your way, and make a selected collection to share or print. It works for a life still unfolding and for remembering someone.

Open source, locally runnable, and built with Astro. Your stories stay in readable files, with no account, database, compulsory chronology, or custom writing application.

**Status: working early prototype under active development.** Four entirely fictional lives demonstrate the memoir, a contrasting photo album, and different visual treatments. Selected static editions omit unselected stories and their exclusive images. The print experience is an early experiment; protected family access is not implemented. See [development progress](docs/progress.md) for verification and current limitations.

## Run locally

Install Node.js **22.12 or newer**, then open a terminal in this repository:

```sh
npm install
npm run dev
```

Open the local address printed by Astro, usually <http://127.0.0.1:4321>. In a normal terminal, keep it running and stop with `Ctrl+C`. In agent environments Astro may start in the background; use `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` to manage it.

| Page | What to explore |
| --- | --- |
| `/` | Ellen’s coastal memoir |
| `/lives/` | All four fictional lives |
| `/lives/ellen-falk/album/` | The same Ellen stories arranged as a photo album |
| `/lives/ellen-falk/collection/` | A collection for reading together and preparing for print |

```sh
npm run build     # Generate the full public demo in dist/
npm run preview   # Inspect that generated website locally
npm run check     # Check Astro and TypeScript
npm test          # Test content, selection, and preservation behavior
```

These commands do not deploy anything. A local preview is available on your computer; giving relatives a working internet link requires hosting the generated website.

## Make it yours

Start with one story. Edit a Markdown file under `content/lives/<person>/stories/` in an ordinary text editor. Put photographs in that life’s `media/` folder. `life.json` holds the shared introduction, cover photograph, and optional order or facts. Dates, chapters, and an achievement list are never required.

- [Write your first story and make a collection](docs/authoring.md)
- [Full content format and publication rules](docs/content-contract.md)
- [About the fictional people](docs/demo-content.md)
- [Photograph credits and licenses](content/ASSET-LICENSES.md)

The demo content is safe practice material. Keep real personal material in a private working copy. Files committed to a public repository are public even when the website excludes them.

## Build a selected collection

An edition file chooses the lives and stories, in the order you want. Two examples are included:

```sh
npm run build:edition -- ellen-remembrance
npm run build:edition -- ellen-garden
```

The first generates `dist/editions/ellen-remembrance/`, containing three Ellen stories. The second generates `dist/editions/ellen-garden/`, containing two stories in a different order. Distribute **the exact edition folder**, not the parent `dist/` directory. A later full build can replace outputs beneath `dist/`; your source files remain in `content/`.

Every selected life includes its shared profile and cover image. Stories require an explicit `access: public`; missing access or `access: private` excludes them from generated pages. Originals kept in `originals/` are never published by the content pipeline. Media are included only when a selected profile or story references them. Do not place personal files in `public/`, which Astro copies independently.

An edition is a public selection, not a password-protected family area. Accounts, passwords, and access revocation are not implemented. Once shared, a generated website or printed collection can be copied by its recipient.

## Project direction

Creators choose the voice, order, source treatment, and audience. Obsidian is optional; this project does not try to replace a document editor. Markdown is the first publishing format, while further import and preservation workflows are bounded experiments.

Implementation was authorized on 2026-09-19 after an earlier discovery-only pause. The original discussion remains in the [discovery record](docs/discovery.md). For decisions and ongoing work, read the [product brief](docs/product-brief.md), [decision notes](docs/decisions.md), [progress](docs/progress.md), and [agent instructions](AGENTS.md).

## License

Project code and original demo prose use the [MIT license](LICENSE). Photographs retain their [recorded licenses](content/ASSET-LICENSES.md). This does not grant rights to anyone’s personal stories, recordings, or family photographs.

Cormorant Garamond and Source Sans 3 are served locally under the SIL Open Font License; [their notices](public/font-licenses.txt) accompany every built edition.
