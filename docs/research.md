# Research notebook

Initial scan: 2026-09-19. Sources are official product/project documentation. This is an initial comparison, not a complete feature or pricing audit. Recheck features before relying on them during implementation.

## Life-story products

| Product | Verified approach | Outputs and lessons |
| --- | --- | --- |
| Storyworth | Prompts, writing and photos; upgraded offerings include phone recording/transcription and guided interviews. | Hardcover books and downloadable PDFs. Backup documentation describes individual-story PDFs and image folders. Familiar authoring channels matter; do not describe it as writing-only. |
| Remento | Recorded responses can become editable transcripts or narratives, with photographs and invited collaborators. | Hardcover books with QR links to recordings; FAQ describes text/PDF exports and downloadable audio/photos. Keeping the original voice alongside prose is relevant. |
| Storii | Phone-based storytelling, transcription, and other text/media contributions. | Audio and transcript exports; selective export is a useful precedent. Contributing need not require learning the website. |

Sources:

- Storyworth: https://welcome.storyworth.com/what-is-storyworth
- Storyworth backup: https://help.storyworth.com/en_US/privacy/getting-a-backup
- Remento: https://www.remento.co/faq
- Storii: https://www.storii.com/ and https://www.storii.com/faqs
- Storii export announcement: https://www.storii.com/blog/introducing-storii-audiobook-downloads

Not established by this scan: detailed per-story access rules across products, self-hosted website export, Markdown/Obsidian interoperability, reliable editable-DOCX round trips, or full structured preservation of source relationships. Absence from this scan is not evidence of absence. Danish language support and Danish print delivery were not verified.

Inference: stories/photos/book production already have strong precedents. MyLifeBook's promising focus is a durable, editable, locally owned collection with flexible presentation and selected outputs. Downloads alone are not a unique feature; these products already offer exports.

## Quire: relevant publishing precedent

Getty's open-source Quire uses plain-text files and static-site generation to produce websites, PDFs, and ebooks from shared source content. It supports images, audio/video embeds, and print-oriented publication. Personal histories are among its stated use cases.

- Overview: https://quire.getty.edu/about/quire/
- Tutorial: https://quire.getty.edu/docs-v1/tutorial/
- Page/output inclusion: https://quire.getty.edu/docs-v1/pages/

Inference: useful inspiration or candidate to investigate for the publication pipeline. It is not a verified match for the desired authoring or private-sharing workflow, and it has not been selected instead of Astro.

## Pandoc: document conversion

Pandoc supports DOCX and Markdown as input/output formats. Its extract-media option can extract document media and adjust references.

- Supported formats: https://pandoc.org/
- Conversion examples: https://pandoc.org/demos.html
- Manual: https://pandoc.org/MANUAL.html

Inference: ordinary Word documents with photos are a plausible import path. A spike must measure image order, captions, links, source traceability, and repeat-import behavior. Supported conversion is not a guarantee of layout fidelity or safe bidirectional synchronization. Do not imply ordinary scanned PDFs are directly handled as text by this path.

## Astro and Starlight

The founder suggested Astro. Astro defaults to prerendered pages and supports on-demand routes. Starlight describes itself as a full-featured documentation theme built on Astro.

- Rendering: https://docs.astro.build/en/guides/on-demand-rendering/
- Content collections: https://docs.astro.build/en/guides/content-collections/
- Starlight: https://starlight.astro.build/getting-started/

Recommendation, not decision: evaluate custom Astro presentation for the life website. Starlight may fit project documentation more naturally than an intimate illustrated biography, though customization could be explored.

Engineering implication: private content requires real access enforcement or an explicitly evaluated encryption approach. Removing navigation or drawing a code-entry overlay does not protect downloadable HTML or assets. Public-only builds and protected delivery should be evaluated separately before selecting a deployment model.

## Follow-up research

- Visually strong personal-history, editorial, photographic, and digital-book examples; record specific lessons rather than copying designs.
- Current Astro content handling, printable output options, and portable local development.
- Markdown conventions versus optional Obsidian extensions and ordinary DOCX imports.
- Practical shared-code or account-based protection, including media and generated search output.
- Media longevity, external-link failure, and portable export.
- Language requirements, including whether Danish and English are initial targets. Language support is not yet a user decision.

## OpenSpec planning workflow

Reviewed 2026-09-19 after the founder raised it. OpenSpec distinguishes specifications of current behavior from proposed changes. A change can contain a proposal, design, tasks, and requirement deltas. Its documentation also supports exploration before implementation.

Primary source: https://github.com/Fission-AI/OpenSpec/blob/main/docs/overview.md

Recommendation: the existing Markdown notes and a focused prototype brief are sufficient now. Consider OpenSpec later for concrete changes such as repeat-import behavior or private-content exclusion. Adoption is optional; it was not installed. This is a project-fit judgment, not a claim that OpenSpec requires heavyweight process.
