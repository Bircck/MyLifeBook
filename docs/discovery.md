# Discovery record

This is a faithful paraphrase of the founding conversation, not a verbatim transcript. User directions and interviewer proposals are separated. Recorded 2026-09-19.

## Initial idea

The founder wants projects a future agent can work on autonomously. The first is a person-life website, biography, or book-like collection. Material may come from physical and digital photo albums. Stories should be illustrated with a selected number of relevant images. Share the entire collection or particular parts. Conduct a grilling interview, then retain the findings in a repository for eventual server-based agent work.

## Round one

### Q1: First person and examples

User: Build default examples useful for testing and later showcasing different lives: older person, child, teenager, adult. Eventually include a personal example; an existing biography Obsidian vault can inspire it.

Interpretation: Four fictional demo lives are a reasonable starting proposal. No vault has been inspected or imported.

### Q2: Main payoff and outputs

User: Tell a person's overall story, facts, details, specific experiences, and stories they know. The subject or another person may prepare it. Others adding stories is a far-future possibility. Chapters could feel like a book; the website or selected elements could become a book. Danish handwritten tell-me-about-your-life books are inspiration, but requiring lots of handwriting is unattractive. One or more ordinary documents, including images, might be easier to author and later convert to Markdown or a website. Research competitors and related projects.

### Q3: Audience

User: Preserve memories of a father after his death and potentially give others a book or website about him.

Interpretation: This motivates remembrance and selective distribution; it does not mean the product is only for deceased people.

### Q4: Agent role

User: Improve the concept, prototype features, iterate on design and examples, research similar products. Make it easy to use a research agent for these tasks.

### Q5: Inputs and effort

User: Ideally allow all information channels and material, accepting it as-is or converting it into something usable. Do not arbitrarily restrict possibilities. Keep the baseline lightweight; external storage is preferable for big videos. Small replayable audio is appealing.

Interviewer proposal: Distinguish preserving arbitrary original files from understanding and publishing each format automatically.

## Initial research

Storyworth, Remento, Storii, Quire, and Pandoc were reviewed. See research.md for sources, limitations, and inferences. No vendor or framework was adopted.

## Round two

### Q6: Intended preparer

User: An open-source project anyone can fetch locally and play with. An agent can perform heavy lifting because information is flat and simple, perhaps with a few skills or no extra assistance. Astro is appealing; uncertain whether Starlight fits.

### Q7: Editing and re-import

Interviewer proposed preserving originals and presenting re-import changes for review rather than silent overwrites or automatic two-way synchronization.

User: Sounds fine, but behavior depends on formats. A required template might make updating reliable but would block others; the workflow must be easy and smooth.

Status: Tentative acceptance, not a finalized import contract.

### Q8: Structure

User: No required format for someone's life. Creators should arrange things as they please. Suggestions can make material book-friendly or linkable.

Interviewer had proposed independent stories with optional chapters and collections. The user confirmed freedom of arrangement, not a specific internal schema.

### Q9: Sharing and tools

User: At a funeral, perhaps share only a few appropriate stories, while closer relatives access other sections with a code. Long-term use may need security controls. Unsure whether an Obsidian-like linked setup makes sense, but forcing Obsidian on everyone is unfriendly.

Status: Need is clear; access mechanism is open. The earlier recommendation to start with separate editions was not accepted as the final solution.

### Q10: AI editing

User: The creator should choose. One interview might need word-for-word preservation; another might yield only key findings. Treatment depends on person and format.

### Q11: First result

User: A website containing life information and stories, possibly multiple prototypes with different styling. Considering design/frontend skills, good websites, and research is extremely important for quality, though not an absolute requirement to use a particular skill.

Status: Website-first visible result; the interviewer's proposed simultaneous printable-PDF milestone was not confirmed.

## Explicit repository request

User asked to ensure findings are saved to GitHub, suggesting MyLifeBook as the name. Repository creation and documenting the ongoing interview are authorized now; the entire product design is not settled.
