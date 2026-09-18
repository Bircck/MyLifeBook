# Editorial website research — 2026-09-19

## Bounded experiment

**Question:** Can a personal life collection feel like a considered publication while remaining easy to browse, share selectively, and print from ordinary files?

**Deliverable:** A main memoir presentation and a smaller photo-led contact-sheet alternative using the same Ellen Falk content, supported by an early selected print collection. These are agent recommendations for the authorized implementation session, not newly discovered founder requirements.

**Stopping condition for this research:** Three primary-source references inspected, eight reusable photographs procured and visually checked, and concrete comparison criteria handed to implementation. This research does not claim user validation or a completed UI evaluation.

## Primary sources and observed findings

All sources accessed 2026-09-19. The pages were read directly; the Public Domain Review essay, Yale publication cover/reading transition, and Rijksmuseum collection search were also inspected in the browser at desktop size. No source site's content, interface code, or assets were copied into MyLifeBook.

### Getty Quire / Yale University Art Gallery

Sources: [Quire](https://quire.getty.edu/) and [Italian Paintings at the Yale University Art Gallery](https://publications.artgallery.yale.edu/italian-paintings/).

**Observed:** Quire explicitly supports website, print, and e-book output from plain-text sources. The Yale example separates a strongly framed cover from continuous text; a compact control bar exposes contents and next-page navigation. Its publication includes source/provenance information, photo credits, and an alternate PDF format. The desktop text column is fairly wide.

**Inference for MyLifeBook:** Use a distinct opening composition and then give reading a restrained, narrower measure. Treat print and web as selections of shared content. Provide source context as a small, deliberate part of the page rather than allowing metadata to dominate every paragraph. Quire validates this publishing pattern; adopting Quire itself is not necessary for the first Astro experiment.

### The Public Domain Review

Sources: [Homepage](https://publicdomainreview.org/) and [Veronese's Dogs](https://publicdomainreview.org/essay/veroneses-dogs/), published 2026-09-16.

**Observed:** The essay has a clear title/byline/introduction sequence, generous margins, a narrow serif reading column, and much wider images between text passages. Captions link to image sources. The homepage offers both essays and collections. A compact navigation bar remains during reading.

**Inference for MyLifeBook:** A memoir need not reduce every story to an identical card. Alternate an authored reading path with photographic pauses; keep captions readable and nearby. Small labels can explain who wrote a passage and whether it is edited or verbatim. Avoid copying the publication's dense global navigation into a small family collection.

### Rijksmuseum Collection

Sources: [Collection](https://www.rijksmuseum.nl/en/collection) and [Artwork search](https://www.rijksmuseum.nl/en/collection/search?collectionSearchContext=Art&page=1&sortingType=Popularity).

**Observed:** The desktop search places a varied, edge-to-edge image mosaic behind a prominent search/filter bar. Collection material also supports visitor-made stories. Images offer immediate visual discovery, while titles and creators remain available in the accessible page structure.

**Inference for MyLifeBook:** A contact sheet can offer an alternative entry point into the same stories when a visitor remembers a place or object rather than a title. It should retain visible titles and captions, an orderly keyboard path, and an explicit way back to reading. It should not require a museum-scale search interface or user accounts.

## Comparison to run with the same content

These are expected tradeoffs, not findings about a completed application.

| Criterion | Main memoir | Contact-sheet alternative | Evidence to collect |
| --- | --- | --- | --- |
| First impression | A chosen cover and short introduction establish a voice. | Several images immediately reveal variety. | Can a new visitor identify whose collection this is and open a story without explanation? |
| Reading | A clear measure and generous paragraph rhythm support longer stories. | Browsing comes first; a separate story view must still read well. | Inspect a complete long story at desktop and narrow width. |
| Imagery | One large image can establish mood; later images provide pauses. | Many crops create discovery but may conceal details. | Inspect coast, portrait hydrangea, and sewing-machine crops; keep full-image viewing available. |
| Mobile | One column should remain naturally linear. | A dense mosaic may become tiny or disordered. | Check a 360–390-pixel viewport, source order, labels, and touch targets. |
| Accessibility | Headings, named links, contrast, and visible focus matter more than ornaments. | The photo grid must work without hover, color, or visual recognition alone. | Keyboard traversal and actual text/contrast checks; no image-only unlabeled links. |
| Individuality | Typography, color, editorial opening, and creator ordering can express one life. | Objects and places offer another sense of personality. | Compare child, teenager, adult, and older-person examples without imposing one chronology. |
| Selected sharing | A deliberate small edition should feel complete. | Selected items should still have coherent labels and context. | Inspect the actual generated output, including asset files, for excluded material. |
| Print | Reading order is already apparent. | The visual browse order is not automatically a useful book order. | Use explicit creator selection/order and inspect rendered pages. |

## Asset result

Eight CC0 photographic derivatives are now local under `content/lives/*/media/`; exact creators, source pages, license evidence, original identifiers, transformations, and verified descriptions are recorded in [ASSET-LICENSES.md](../content/ASSET-LICENSES.md). The set covers Danish dunes, a domestic bread still life, a vintage sewing machine, Alpine travel, hydrangeas, leaf details, a skateboard, and bread with butter. It contains no identifying portrait used as a fictional person. The images are explicitly illustrative; they are not fake family archives.

Files are capped at 1920 pixels on the long edge, with a total photographic payload of about 3.44 MB. Portrait flower/leaf images should preserve their proportions in the alternate view. The Alpine image is aerial, so captions must not claim it was taken from a train. These concrete composition checks were passed to the content author before integration.

## Provisional recommendation and next critique

Use the memoir as the initial reading experience and keep the contact sheet as a focused alternative. Evaluate it with the exact same content before expanding templates. Let each fictional life choose its own visual accent and editorial organization, with clear links between stories and optional collections. The promising improvement after the initial build is faithful selected output with source/caption continuity; another elaborate browsing system would add less evidence at this stage.

Still unverified here: the implementation's actual mobile layout, accessibility, source-order behavior, print pagination, and privacy boundaries. Those need direct checks against the built application. No simulated-persona responses are evidence of real visitor needs.
