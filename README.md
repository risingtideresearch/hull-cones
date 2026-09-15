# hull-cones

Developable bottom for a hard-chine hull with a polyline chine: one cone per
chine segment, one cubic Bezier frame per cone, seams derived as the
intersection of adjacent cones, exact unrolled plates, STEP export.

- `index.html` - the authoring tool (published at GitHub Pages)
- `pages/05-explainer.html` - interactive explainer of the construction
- `pages/01`..`04` - earlier design pages, kept for reference
- `experiments/` - numpy / node experiments (seam folds, refinement, Michell wave resistance)
- `bottom-demo.step` - a demo STEP export of the default design
- `CLAUDE.md` - geometry results, decisions and correction log

Everything is self-contained HTML/canvas, no dependencies, no build step.

    python3 experiments/michell_refinement.py
    node test/strict_dom_check.js index.html
