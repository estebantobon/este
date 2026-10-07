# Claim Atlas

The data behind the Play page. Each entry is one NotebookLM infographic. It carries the claims the infographic makes, the YouTube videos those claims came from, and a grade for how well each claim holds up against published evidence.

## Layout
```
atlas/
  entries/<slug>/entry.json   claims, grades, sources (schema: schema/entry.schema.json)
  entries/<slug>/notes.md     optional: your synthesized notes from the source videos
  scripts/build.mjs           validates entries, writes dist/atlas.json
  dist/atlas.json             what play.html loads
assets/atlas/<slug>.webp      the infographic (max 1400px, WebP q80)
```

## Evidence grades
| Grade | Strongest evidence that exists |
|---|---|
| A | Randomized controlled trials or meta-analyses in humans |
| B | Smaller human studies: observational, open-label, case series |
| C | Animal or cell studies only |
| D | Mechanism, anecdote or opinion, no direct study |

The grade describes the evidence. The verdict describes the claim's wording:
- **holds**: the claim matches what the evidence shows
- **overstated**: there is real evidence, but the claim goes past it (animal to human, "stronger than before")
- **unsupported**: nothing backs the claim as stated

## Adding an entry
1. Export the infographic and save it as `assets/atlas/<slug>.webp`.
2. Copy an existing `entries/<slug>/entry.json`, list the source videos and the infographic's claims.
3. Grade each claim and keep `"status": "draft"` until a person has read every ref.
4. Run `node atlas/scripts/build.mjs`.

Nothing here is medical advice. The point is to show how claims from popular health videos compare with the literature.
