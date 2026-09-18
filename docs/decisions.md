# Decision tree

Updated 2026-09-19. Status terms: **confirmed**, **tentative**, **proposed**, **open**, **deferred**.

**Current instruction: do not start implementation.** The founder explicitly stopped any potential transition from planning into building. Only discussion/research notes are being preserved. The older branches below record unresolved design details, not an active work queue.

## Latest answers and overrides (Q12-Q15)

- Q12: Sharing with other people is essential. The founder delegates choosing suitable formats/setup; do not ask them to resolve infrastructure terminology. No hosting or authentication system is selected.
- Q13: Keep authoring as simple text/files and existing tools. Do not build a Google Docs replacement.
- Q14: Three requested simulated creator perspectives have been gathered; see creator-perspectives.md. These are hypotheses, not real user research or binding design choices.
- Q15: Website-first with early print exploration is acceptable. Include how book output could work; multiple complete implementations are unnecessary.
- OpenSpec: raised as a possibility, not requested for installation. Recommendation is to retain simple Markdown planning and reconsider it for later concrete changes.
- No application code, visual prototype, deployment, or autonomous development has been started. A future explicit implementation request is needed.

## Settled foundations

| Decision | Status | Basis |
| --- | --- | --- |
| Open-source project people can fetch and use locally | Confirmed | Q6 |
| Flat, simple, portable information; agents can assist | Confirmed direction | Q6; exact representation open |
| Website presenting life information and stories | Confirmed | Q2, Q11 |
| Book or selected book output is desired | Confirmed aspiration | Q2; delivery milestone open |
| Creator controls structure and editorial treatment | Confirmed | Q8, Q10 |
| Obsidian must not be mandatory | Confirmed | Q9 |
| Support selective sharing as a product concern | Confirmed | Initial idea, Q3, Q9 |
| Use life-stage examples for demos/testing | Confirmed direction | Q1; four is working interpretation |
| Preserve originals and review re-import changes | Tentative | Q7; ease of use and formats qualify acceptance |
| Favor Astro as a candidate | Tentative | Q6; no architecture selection yet |
| Public repo named MyLifeBook | Operational choice | Explicit GitHub request plus open-source direction |
| MIT license | Initial maintainer default | Reversible setup choice, not an interview answer |
| Third-party story contributions | Deferred | Q2: far-future possibility |

## Tree and current frontier

1. **Open-source, local use**
   - Open: should first operation assume agent/terminal help, or include a graphical workflow?
   - Open: is a running server acceptable for optional protected sharing?
   - Downstream: installation, packaging, deployment, and authentication implementation.
2. **Flexible source material**
   - Open: initial import formats and what an unsupported file does.
   - Open: primary editing location and review behavior after re-import.
   - Proposed: optional templates; ordinary documents remain accepted.
   - Downstream: stable identity, change matching, conflict handling, source metadata.
3. **Creator-defined life structure**
   - Confirmed: no compulsory chronological outline or chapter template.
   - Open: minimal internal representation supporting links and reusable selections without authoring friction.
   - Downstream: book ordering, navigation, index pages, cross-references.
4. **Website with selected/private material**
   - Open: selected public editions, protected collections, or both in the first implementation?
   - Open: shared codes versus individual access; offline reading needs.
   - Downstream: revocation, media protection, search/export leakage, hosting integration.
5. **Creator controls editorial treatment**
   - Confirmed: verbatim, summary, or narrative may all be appropriate.
   - Open: is AI editing an external agent workflow initially, or built into the project?
   - Downstream: review UI, per-source settings, provider configuration.
6. **Design exploration and publication**
   - Open: preferred initial visual directions; degree of life-specific styling.
   - Proposed: compare designs against the same fictional sample.
   - Open: when book output must become a working deliverable.
   - Downstream: print layout, typography, media fallback, selected-book composition.
7. **Autonomous improvement later**
   - Confirmed: research, prototypes, features, and design iterations are useful work.
   - Open: first agent milestone, review cadence, resource limits, and server environment.
   - Downstream: scheduling and actual deployment. Neither has been requested yet.

## Previous interview round (answered above; retained for context)

- Q12: May optional protected sharing require a server, while ordinary public collections remain easy to host?
- Q13: Is agent-assisted file editing sufficient initially, or must a nontechnical creator manage everything in a graphical interface?
- Q14: Which presentation directions should the initial prototypes compare, such as illustrated memoir, intimate family album, or exploratory life archive?
- Q15: Must printable book output work in the first prototype, or should it follow the website/design proof?

These questions have now been answered as recorded above. Do not ask them again. Remaining technical details can be investigated when future work is authorized; no further questionnaire or implementation is active now.
