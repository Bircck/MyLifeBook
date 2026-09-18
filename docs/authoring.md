# Write a story, then grow the collection

You can begin with a paragraph. A life does not need a timeline, finished biography, or answers to a questionnaire before it is worth keeping. Use your usual text editor; agent assistance is optional.

The examples below are invented practice material. For real stories, use a private working copy and material you have permission to publish. The supplied demo people are fictional, so replace their identities and source labels before creating an actual person’s collection.

## 1. Try your first story

Start the local site with `npm run dev`. In a text editor, create `content/lives/ellen-falk/stories/the-red-mug.md` and paste:

```markdown
---
id: the-red-mug
title: The red mug
excerpt: A small thing that made the kitchen feel familiar.
access: public
source:
  label: Fictional practice story
  type: original
  treatment: Invented prose for learning how this project works.
---

The red mug always stood beside the kettle. Nobody remembered buying it,
but everybody knew which cupboard it belonged in.

Some stories begin with an object. This one can grow from here.
```

Save the file and open `/lives/ellen-falk/` in the local site. The story appears after the existing ordered stories. Its own page is `/lives/ellen-falk/stories/the-red-mug/`. The first block between `---` lines gives the page a name and publication settings; everything below it is the story.

Use the same lowercase, hyphenated name for the filename and `id`. Keep the ID stable when changing a title so its URL stays the same. Put quotes around a value containing a colon, such as `title: "Sunday: the long version"`.

Only `id` and `title` are required for a story, but **it appears on the website only with `access: public`**. Removing that line, or changing it to `access: private`, keeps the story out of all generated editions, including the local site. There is no private reader view yet; keep editing unpublished stories in your usual editor.

You can write paragraphs, **bold text**, *emphasis*, lists, headings, and quotations in Markdown. There is no automatic rewriting. A paragraph copied verbatim from an interview, an edited account, and a summary should have different, accurate `source.treatment` descriptions. Do not use an invented quotation to fill a gap in a real memory.

## 2. Add a photograph, if it helps

A story does not need an image. To add one, save an appropriately licensed or permissioned image in the same life’s `media/` folder, then add these lines above the closing `---`:

```yaml
image: red-mug.jpg
imageAlt: A red ceramic mug standing beside a white kettle
imageCaption: Describe who made the photograph and what it actually shows.
```

The filename must exist. `imageAlt` describes the visible image for readers who cannot see it; a caption can give its context and credit. If the picture is illustrative, say so rather than implying it records the event.

JPG/JPEG, PNG, WebP, GIF, and AVIF are supported. Put additional images into the story with `![A useful description](red-mug.jpg)`. Images must belong to the same life’s media folder. Remote image URLs and unsupported formats fail with a visible error rather than disappearing silently.

Original scans, interview recordings, and source documents can be retained in `content/lives/<person>/originals/`. The publishing pipeline does not copy this folder. Keep untouched originals alongside an edited story when preserving them is appropriate; source labels explain what readers are seeing. An `originals/` folder in a public Git repository is still public, so keep personal originals in your private working copy.

## 3. Make a profile for your person

When you are ready to move beyond the demo, create a new folder, for example:

```text
content/lives/your-person/
  life.json
  stories/
    the-red-mug.md
  media/
    cover.jpg
  originals/
```

Copy your story into `stories/`, provide a cover photograph in `media/`, and create `life.json`:

```json
{
  "id": "your-person",
  "name": "Your person’s name",
  "subtitle": "A collection of small memories",
  "intro": "A short introduction, in the voice you choose.",
  "hero": "cover.jpg",
  "heroAlt": "An accurate description of your cover photograph",
  "heroCaption": "The photograph’s context and credit.",
  "theme": "memoir",
  "storyOrder": ["the-red-mug"]
}
```

`life.json` is required. Its only required fields are `id`, `name`, `hero`, and `heroAlt`. The `id` matches the enclosing folder. This prototype currently needs one profile image, even if individual stories have none.

Optional facts, quotations, introductions, and display years let you make the profile your own. The available demo treatments are `memoir`, `playful`, `electric`, and `warm`; they are visual choices, not age restrictions. All the fields are described in the [content reference](content-contract.md).

`storyOrder` arranges stories; it does **not** hide them. Public stories left out of that list follow alphabetically by filename. To withhold a story from every public output, set `access: private`. To share only some public stories, make an edition in the next step.

Dates are optional. When useful, a story can have `date: "One summer afternoon"` or an integer `year: 1994`. A profile can use `years: "A life in progress"`. You decide how precise to be; the application does not force chronology or infer missing facts.

Profile information and the cover image are shared with **every edition containing this person**. This includes facts, quotations, captions, and descriptions. Keep information needing separate selection in stories, rather than the shared profile. There is no private-profile setting.

## 4. Choose a collection to share

An edition is a small JSON file listing which public stories to publish and in what order. Create `content/editions/a-few-memories.json`:

```json
{
  "id": "a-few-memories",
  "title": "A few memories",
  "description": "A small collection for reading together.",
  "selections": [
    {
      "life": "your-person",
      "stories": ["the-red-mug"]
    }
  ]
}
```

Build it from the project terminal:

```sh
npm run build:edition -- a-few-memories
```

The result is `dist/editions/a-few-memories/`. That exact folder is the website to distribute. It contains selected profiles, selected stories, and images those pages reference. Unselected stories and their exclusive images are omitted. Naming a private or missing story is an error. An edition’s order overrides the profile’s `storyOrder`.

The regular `npm run build` generates the default demo with **all public stories from all life folders** in `dist/`. It can replace earlier edition outputs below that directory. Your manuscripts remain in `content/`; generated outputs are disposable and can be rebuilt.

The included `ellen-remembrance` and `ellen-garden` files show two selections from the same manuscripts. You do not need to maintain separate copies of a story for different audiences.

The local collection page is `/lives/<person>/collection/`. It offers a reading and early print view. Browser printing is still an experiment: inspect the preview, page breaks, captions, and selected stories before handing a collection to anyone. A printout or saved PDF is another copy of its selected public content.

## 5. Check what readers will receive

Run `npm run build` for the full site, or the edition command for a selected collection. A successful build catches many missing filenames, unsupported images, and broken story references. Inspect the actual output you intend to share as well.

To link stories within one life, write `[Another memory](story:the-red-mug)`. The destination must be included in the same edition; an excluded destination causes an error. Ordinary external web links and email links also work. Arbitrary links to local original files are rejected.

Keep personal material out of Astro’s `public/` folder. That folder is copied directly, outside the story-selection rules. Images in `media/` have no separate access flag: using one in a published profile or story includes it in that edition.

Selection does not provide passwords or authentication. Anyone who receives a published website URL can read its published contents. Keep genuinely restricted material unpublished until a delivery system protects both pages and assets. Neither a local preview nor a build command deploys your website.

## Current boundaries

This is an early publishing format with ordinary file editing. It has no document editor, automatic biography writer, private reader login, or general-purpose parser for arbitrary documents and recordings. Supported images and Markdown render; merely storing another file under `originals/` does not import or display it. Raw HTML is sanitized, so scripts and embedded frames are not an authoring extension.

See the [content reference](content-contract.md) for precise behavior and [development progress](progress.md) for experiments and verified results. The [photo licenses](../content/ASSET-LICENSES.md) and [fictional-content notes](demo-content.md) explain what is included in the demo.
