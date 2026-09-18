# Development progress

Updated 2026-09-19. Branch: `codex/first-living-edition`.

## Authorization and direction

The founder's subsequent attached request explicitly authorizes implementation, research, dependencies, local previews, subagents, and regular commits/pushes. It supersedes the planning-only pause earlier on 2026-09-19. No purchases or server deployment. Historical discovery remains intact.

## Completed experiment — first living edition

Question: can simple files become a distinctive life website, a genuinely selected static edition, and a useful early print collection?

Deliverable: custom Astro site, one strong fictional memoir plus child/teen/adult examples; alternate photo album; selected output; printable collection.

Evidence required: runnable build, desktop/mobile visual inspection, accessible controls, selected story/media exclusion tests, inspected print output.

Result: custom Astro 7 site, four fictional lives, fourteen public stories, eight locally stored CC0 photos. Memoir, alternate album, full story reading, selected-content search, book selection/reordering, and A5 print collection work. Astro chosen for static portable publication without a mandatory runtime/database; custom presentation, no Starlight.

Evidence: `npm run check` no diagnostics; 32 content/import tests; eight built-output privacy/resource tests; 16 browser checks passed across initial run and targeted rerun after fixes. Desktop and 390px/320px inspected; all images decode; no horizontal overflow; four main page types pass axe WCAG A/AA rules. Search Escape/focus and low secondary-text contrast fixed. Private development source URLs now return 403/404 through Vite deny rules. See privacy-review.md.

Print: eight-page A5 proof generated at `artifacts/print/ellen-selected.pdf`, all pages visually inspected. Three chosen stories, separate photographic openings and reading pages, captions, source notes, contents, page numbers. Fixed initial unwanted spillover. Arbitrarily long custom stories still need print review.

Preview running at `http://127.0.0.1:4321/`. Local artifacts/screenshots contain actual desktop/mobile/album/story/collection captures. No deployment.

## Run commands

`npm install`, `npm run dev`, `npm run build`, `npm run check`, `npm test`.

`npm run build:edition -- ellen-remembrance` → `dist/editions/ellen-remembrance/`; then `npm run test:output`. Run default build before edition build: default build replaces dist. `npm run test:browser` checks a running preview. `npm run print:proof` makes the fictional A5 proof from the preview (Edge on Windows / installed Chromium elsewhere).

Astro may run development in the background in agent environments: `npx astro dev status`, `npx astro dev logs`, `npx astro dev stop`.

## Prioritized next questions

1. Finish source-preserving Markdown/DOCX staging documentation; independently inspect output and local-edit conflicts.
2. Evaluate genuinely protected delivery of an entire static edition (isolated loopback server experiment; no private-build bypass).
3. Reduce photo payload and print PDF size without sacrificing source originals or selection guarantees.
4. Improve the path from import review to a first personal collection, without creating a document editor.
5. Explore optional audio plus a print fallback only if it improves storytelling without hiding missing transcripts.

## Known limits

No deployment or finished family authentication. Public editions require domain-root hosting; no base-path support yet. Profile/hero always accompany selected stories. Reader-selected books are a convenience, not an access boundary. Content import supports a bounded Markdown/DOCX staging path (tests pass; documentation in progress), not arbitrary document fidelity or publication. Photos are illustrative licensed assets. PDF proof is currently ~11 MB; image filtering is a likely optimization target. Real personal content must stay outside the public source repository.
