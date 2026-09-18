# First publishing-boundary review

Reviewed 2026-09-19 against the running local application and actual Astro build output. All subjects and canaries are fictional. This is a bounded engineering review, not a claim of authenticated private hosting or a general security certification.

## Question and result

Does a selected public website omit stories, people, and images outside the edition, including less-visible output such as search data, print pages, credits, and compiled assets?

**Yes for the inspected output.** The default build contains four lives, 14 public stories, 35 HTML pages, and eight photographs. `ellen-remembrance` contains Ellen's shared profile, three selected stories, 12 HTML pages, and exactly three photographs: coast, table, and sewing. No private fixture text, private asset, excluded story identity, or other-life identity was found in the selected output.

The inspection included every output file, including image and font bytes, CSS, and inline scripts. The completed-output test suite has eight passing checks and requires real builds; it does not replace the build with a mocked content loader.

## Evidence

Run these commands in order:

```sh
npm run build
npm run build:edition -- ellen-remembrance
npm run test:output
```

The default build clears `dist/`, so it must precede the selected build. The tests inspect the default output without recursively treating the separate `dist/editions/` outputs as part of that website. Each edition is checked as its own distribution folder.

`tests/output.test.ts` checks:

- Private story and image canaries are absent from every file's name and bytes, across both outputs.
- The selected build omits other lives, unselected story IDs and titles, and exclusive unselected image filenames.
- HTML routes match the source edition exactly; missing or extra routes fail.
- Media filenames match an independent fixture allowlist, and published image bytes match their intended source.
- No raw manuscripts, originals, source maps, server bundles, filesystem imports, or local project paths ship. New unreviewed export formats fail visibly.
- Every selected search index embedded in page HTML contains exactly the selected stories. The print page contains those same stories in manifest order.
- The credits table lists exactly the included images.
- Every local page link, image, CSS resource, and HTML anchor resolves within its standalone output.

The loader's separate tests exercise missing-access defaults, explicit private selection rejection, broken story/media references, duplicate IDs, media traversal, Windows junction escape, mismatched file signatures, unsupported image formats, script sanitization, executable frontmatter rejection, and unchanged originals. Those establish input behavior; completed-output checks establish what actually shipped.

## Findings fixed during review

**Raw sources were reachable through the development server.** Initially, the intended private story and media routes correctly returned 404, but Vite returned the private fixture bytes from `/content/lives/ellen-falk/stories/a-letter-kept.md`, its original SVG path, and an absolute `/@fs/` request. The server was bound to loopback, and these files were absent from static builds; this was nevertheless an avoidable source-access path.

The Astro configuration now denies development-server file access to `content/`, `imports/`, and `artifacts/`, alongside Vite's existing sensitive-file defaults. After the change, the tested source paths and `/@fs/` paths returned 403 without canaries. Case variants, normalized traversal, and `?raw`, `?import&raw`, and `?url` variants were also denied; encoded path separators returned 404. A referenced public JPEG continued to return 200 with `image/jpeg` and `X-Content-Type-Options: nosniff`.

**Image routes required the correct trailing-slash policy during local development.** Generated image files were already valid standalone JPEGs, but the initial development routing policy disagreed with their URL shape. The root integration changed the policy so `/media/ellen-falk/coast.jpg` is served correctly.

**Credits used a filename transformation that missed nested media.** The application now derives a provenance filename from the unencoded route path, inserting `media/` immediately after the life ID. This accommodates supported nested filenames and spaces. Existing fixture credits matched their selected media before and after the correction.

## Boundaries that remain explicit

- Selected editions are public websites. There is no password, session, access revocation, or protected family delivery.
- Selecting a life includes its shared profile, facts, introduction, quote, hero, and captions. Selection is per story; it does not redact profile fields.
- The browser's book selector is a reading/printing convenience. Other public stories remain in that page's HTML. A separate edition build is the mechanism that omits content from a distributed website.
- Image inclusion follows references from published content. There is no independent image privacy flag. Referenced image bytes are copied unchanged, including any metadata in those source files; the loader does not strip photo metadata.
- Astro copies `public/` independently of selection. The current folder contains only the application favicon, and the output tests require review if that changes.
- Share the exact edition output folder. Sharing the parent `dist/` folder, repository, or source files has a different scope. Real personal material does not belong in the public demonstration repository.
- Links currently assume the website is served at a domain root. A hosting subpath such as `/family/` is not implemented or tested.
- Static hosting controls the final HTTP headers. The development endpoint's MIME and `nosniff` headers do not configure an unrelated static host.
- These checks cover the current HTML, media, search, credits, and print implementation. New feeds, search services, downloadable archives, import publishing behavior, or protected delivery need corresponding output and access tests.

No deployment, external sharing, personal-data import, or authentication experiment was performed as part of this review.
