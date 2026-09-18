# Candidate experiments

These are proposed bounded tasks for later assignment, not a committed implementation roadmap. Q12-Q15 provide enough direction for first-prototype.md; remaining engineering questions can be investigated without a new preference questionnaire.

| ID | Question | Deliverable | Evidence / stopping condition |
| --- | --- | --- | --- |
| R1 | What comparable products and websites offer useful patterns? | Dated source-backed comparison and annotated visual references | Specific takeaways for capture, reading, sharing, and print; distinguish unknowns |
| D1 | Which presentation makes a life feel individual and worth reading? | One primary experience and a focused alternate layout using identical material | Mobile/desktop visual review, legibility and navigation evaluation, comparison rationale; no need for several complete applications |
| C1 | Can the content stay simple without forcing a life template? | Minimal proposed folder/content representation plus examples | Demonstrate an unstructured story, facts, optional chapter, image, link, and source without requiring life stages |
| I1 | Can ordinary documents enter smoothly? | Small DOCX and Markdown import experiment, with originals retained | Photos/order/captions inspected; unsupported content reported; changed-source re-import does not silently erase local edits |
| W1 | Does Astro suit the desired reading experience? | Locally runnable fictional life website | Clear setup, meaningful stories/photos, responsive UI, usable navigation and accessible reading |
| S1 | How should a limited public collection coexist with private stories? | Architecture comparison and, once selected, one focused sharing prototype | Restricted text/media absent from unauthorized responses, search, feeds, and downloadable output |
| P1 | Can selected content become a good book? | Printable PDF experiment | Render and inspect pages for clipping, image/caption quality, ordering, links, and audio alternatives |
| F1 | Does it adapt across life stages? | Fictional child, teenager, adult, older-person sample collections | Different lengths and structures; sparse/unknown dates and optional sections work without fabricated completeness |

## Candidate first visible milestone

A polished website containing one fictional person's life information and stories, one focused alternate layout, and an early example of selected content becoming a printable chapter. Q15 accepts website-first sequencing and asks that book behavior be included in the thinking. See first-prototype.md for suggested scope and evidence.

## Suggested future regression cases

- Re-importing an unchanged source does not duplicate content.
- Source edits are distinguishable from locally edited prose.
- Selecting a public subset excludes other text and media from all generated public artifacts.
- Optional chapters/dates are genuinely optional.
- A missing external recording does not make the story unreadable.
- Verbatim content is preserved when that treatment is requested.
- Selected book content follows the creator's chosen order.

Add tests when corresponding behaviors exist; do not build a test suite around unapproved architecture or placeholder content.
