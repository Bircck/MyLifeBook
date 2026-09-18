# Product brief

Updated: 2026-09-19. Source: founding discovery interview.

## Purpose

Tell a person's life through biographical details, their experiences, stories they know, and selected photographs. The collection may be prepared by the subject or someone else. It should support remembering a loved one and giving others a meaningful account of that person's life.

A website is the immediate product vision. A book-like experience, printable book, or conversion of selected elements into a book is also desired. Neither strict chronology nor chapters are mandatory.

## Confirmed direction

### Open and adaptable

The baseline is an open-source project anyone can fetch to their computer and experiment with. Flat, simple information should make agent assistance practical, potentially with a few skills and minimal additional infrastructure. A hosted service, database, custom editor, or specific framework has not been required.

The founder likes Astro as a possible fit. Astro Starlight was raised as a question, not selected.

### Flexible authorship and structure

Creators may arrange a life however they choose. Offer suggestions, links, or chapter arrangements that help with publication; do not impose a life-stage template or mandatory book outline.

Accept source material through multiple channels over time. Documents with embedded photographs may be easier for contributors than learning a new tool. Markdown and an existing biography Obsidian vault may provide inspiration, but using Obsidian must not be required.

Keeping originals and reviewing changes on re-import was tentatively accepted. Exact behavior remains dependent on supported formats and ease of use. A strict input template that blocks ordinary contributors is undesirable.

Q13 explicitly reinforces simplicity: this is text, and the project should not invent Google Docs. Use existing authoring tools and agent assistance; a custom rich-text editing application is outside the initial direction.

### Media

Potential inputs include physical-photo scans, digital photographs, documents, interviews, recordings, and other material. Keep the baseline lightweight. Large video is preferably stored externally; small playable audio recordings are a useful possibility. Initial supported formats and storage details are open.

### Editorial control

The creator controls whether an interview is represented word for word, summarized into key findings, rewritten as a narrative, or treated another way. No universal AI rewriting policy was selected. Provenance and original preservation are proposed engineering safeguards, not an imposed writing style.

### Sharing

Allow sharing a whole life collection or selected elements. One concrete scenario is a limited collection of stories for a funeral, with closer relatives able to access additional material, perhaps using a code. Long-term use may call for access controls. In Q12 the founder delegated the choice of sharing format and setup: sharing with other people is essential, while implementation should be figured out through judgment and experiments. Do not repeatedly ask the founder to choose infrastructure.

Working engineering direction: publish selected content at an ordinary shareable URL, omitting unselected material from that output. Investigate separately protected family collections with host/server-enforced access to pages and media. A shared code may suit a later experiment. This is a revisable recommendation, not a user-selected hosting or authentication system.

### Design quality

The first visible success is an appealing website with information and stories about a person. Explore alternative prototypes and styles. Strongly consider frontend/design skills and research into good websites; no specific skill is compulsory. Q14 requested agent perspectives imagining people preparing a collection for someone else; these are speculative inputs, not user validation.

In Q15 the founder accepted website-first work followed by an early print experiment, while wanting to include how book output could work. A full book-production system is not required in the first prototype. Multiple versions should answer concrete questions, not become several complete products. See first-prototype.md.

## Examples

The founder suggested life-stage examples for showcases and potential automated tests: child, teenager, adult, and older person. The discussion initially said three examples but listed four; working interpretation is four, not a finalized dataset specification.

Use explicitly fictional people and suitable assets. A later personal example can draw inspiration from the founder's biography vault; access to or publication of that vault has not been authorized.

## Later possibilities

- Stories or contributions from other people.
- Print-oriented collections and fuller book production.
- More input adapters, media types, and editing workflows.
- Optional access controls, depending on the selected sharing model.

## Future autonomous work

The founder wants a server agent to improve the concept, research comparable solutions, prototype features, and explore design alternatives at a later date. This is product-development work, not merely automatic biography generation. The repository should make bounded research and implementation tasks easy to resume.
