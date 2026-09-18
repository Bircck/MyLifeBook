# Working on MyLifeBook

Read README.md, docs/product-brief.md, docs/decisions.md, and docs/agent-handoff.md before substantial work.

## Preserve the intent

- This is an open-source, locally usable project with flat, simple, portable information. Do not silently turn it into a hosted subscription service.
- Creator choices govern structure, selection, and editorial treatment. Chapters, dates, life stages, interviews, and Obsidian conventions are not compulsory authoring formats.
- Distinguish confirmed user direction, tentative acceptance, agent recommendations, and unresolved decisions. Never promote a suggestion to a requirement without evidence.
- Astro is a candidate favored by the founder. Evaluate before locking architecture; Starlight is not chosen.
- Preserve source material and source attribution when exploring imports or editorial transformations. Do not fabricate biographical facts.
- Use fictional content for public demos and tests. Do not commit personal vaults, recordings, albums, credentials, or private generated output.

## Research and design

- Research comparable products and good websites when useful. Save dated primary-source links and distinguish findings from inferences.
- Consider available frontend/design skills for interface work and use relevant visual references. The founder values these strongly without mandating one particular skill or design system.
- Compare meaningful design alternatives using the same sample content. Evaluate reading, imagery, accessibility, mobile layout, and the individuality of each life; avoid defaulting to a documentation-site appearance.
- Do not copy third-party content or assets without appropriate rights.

## Implementation and verification

- Work in bounded experiments with a question, deliverable, evidence, and stopping condition.
- Supporting arbitrary source storage is different from implementing every parser. State which import behaviors actually work.
- Make unsupported inputs or uncertain interpretations visible without discarding originals.
- Any restricted-content prototype must protect content and assets, not merely hide UI. Inspect generated HTML, search indexes, feeds, downloads, and media for unintended exposure.
- Prefer targeted tests for meaningful behavior: repeat imports, preservation of edits, excluded content, broken references, and export fidelity. Do not write tests that merely restate the implementation.
- Update notes and decision status when findings change. Summarize what changed, what was verified, and what remains unresolved.

## Current scope

The repository records an ongoing discovery interview. It does not authorize deployment to a server, publication of real personal content, spending money, or an endless unattended run. Future task instructions determine which research or implementation milestone is active.
