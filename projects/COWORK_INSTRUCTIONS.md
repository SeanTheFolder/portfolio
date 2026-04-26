# Project Entry Publishing Instructions for Cowork

## What you're doing
You are adding a new project case study to Sean Welding's portfolio website.
Projects are structured case studies of completed work — different from blog posts
(editorial writing) and different from the Implementations highlight cards (permanent showcase).

The project registry lives at `projects/index.json`.
Individual project files live at `projects/entries/[slug].json`.

## Step 1: Create the project entry file

Create `projects/entries/[slug].json` where [slug] is URL-safe
(lowercase, hyphens, no special characters, no spaces).

Required structure:

```json
{
  "slug": "[slug]",
  "title": "[Project name]",
  "date": "[completion date YYYY-MM-DD]",
  "updated": null,
  "status": "completed",
  "duration": "[e.g. 4 weeks, 3 months]",
  "scope": "[Enterprise | Department | Infrastructure | Process]",
  "category": "[Security | Compliance | Infrastructure | AI & Automation | Operations | Digital | Healthcare IT]",
  "tags": ["tool1", "tool2", "tool3"],
  "summary": "[2-3 sentences, outcome-first. Lead with what changed.]",
  "problem": "[1-3 sentences. What was the situation before this project?]",
  "approach": [
    "[Step 1 taken]",
    "[Step 2 taken]",
    "[Step 3 taken]"
  ],
  "outcomes": [
    { "metric": "[number or short value]", "label": "[what it measures]", "context": "[brief context]" },
    { "metric": "[number or short value]", "label": "[what it measures]", "context": "[brief context]" }
  ],
  "stack": ["Tool1", "Tool2", "Tool3"],
  "compliance": ["HIPAA Security Rule", "CIS Controls v8"],
  "lessons": "[Optional: one paragraph honest reflection on what you learned or would do differently.]",
  "relatedImpl": null,
  "featured": false
}
```

## Step 2: Update the registry

Open `projects/index.json`. Insert a new entry at position 0 (start of the `projects` array).
Update `lastUpdated` to today's date (YYYY-MM-DD).

Registry entry format (summary only — no `approach`, `problem`, `lessons`, `stack`, or `compliance`):

```json
{
  "slug": "[slug]",
  "title": "[title]",
  "date": "[date]",
  "status": "completed",
  "duration": "[duration]",
  "scope": "[scope]",
  "category": "[category]",
  "tags": ["tag1", "tag2"],
  "summary": "[same summary as full entry]",
  "outcomes": [first 2 outcomes only],
  "featured": false
}
```

## Step 3: Verify

Confirm both files are valid JSON before finishing. Run a JSON parse check on each.

## Field rules

- `slug` — lowercase, hyphenated, URL-safe. Must match the filename exactly.
- `date` — completion date in YYYY-MM-DD form.
- `updated` — set to a YYYY-MM-DD string only when revising an existing entry; otherwise `null`.
- `status` — `"completed"`, `"ongoing"`, or `"paused"`.
- `scope` — `"Enterprise"`, `"Department"`, `"Infrastructure"`, or `"Process"`.
- `category` — exactly one of: `"Security"`, `"Compliance"`, `"Infrastructure"`, `"AI & Automation"`, `"Operations"`, `"Digital"`, `"Healthcare IT"`. Do not invent new categories.
- `tags` — 3 to 6 specific tools, frameworks, or technologies. Avoid generic words like "automation" alone.
- `summary` — 2-3 sentences. Lead with the outcome, not the activity.
- `problem` — 1-3 sentences describing what existed (or didn't) before the project.
- `approach` — array of complete sentences, each describing one ordered step taken.
- `outcomes` — 2-5 objects with `metric`, `label`, and `context`. The first two appear on the card.
- `stack` — every tool, platform, and product used.
- `compliance` — regulatory citations or framework mappings. Empty array is acceptable.
- `lessons` — optional honest reflection. Set to `null` if nothing useful to add. Do not write filler.
- `relatedImpl` — set to a slug-style identifier referencing a related Implementations card on `index.html` if one exists; otherwise `null`.
- `featured` — `true` to pin to the top of the page; default `false`.

## Sean's voice for summaries and lessons

- Active, specific, outcome-first. "Eliminated domain spoofing" — not "Improved email security."
- Name the actual tool, regulation, or metric. Never be vague.
- Lessons should be genuinely useful to another practitioner, not generic.
- Problem statements should be blunt: "There was no SIEM" — not "The organization lacked mature monitoring."
- Avoid marketing language. Sean does not say "leveraged" or "synergized."

## When Sean gives you a project to add

Ask for (or infer from context):

- Project name and rough completion date
- What problem it solved
- What was built or changed
- What tools were involved
- Any measurable outcome (time saved, % reduction, audit result, etc.)

Fill in the rest using the structure above. Default `featured` to `false` unless Sean says otherwise.
