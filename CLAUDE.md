# hull-cones — context for Claude Code

Exploration of a curved, developable bottom for a hard-chine hull whose lowest
chine is a polyline. Grew out of a chat session (Sept 2026); this file is the
distilled state so the next session doesn't re-derive it.

## The user's tool (background, stated by the user)

- Boat-hull CAD tool built on developable surfaces.
- Workflow: author longitudinal curves (z,y)=f(x) on the starboard side, then
  developable-loft between each adjacent pair, on the principle that a unique
  developable usually exists between two curves (if any exists).
- Bottom = loft between the lowest starboard longitudinal (the chine) and its
  mirror. With a polyline chine the bottom comes out flat.
- User preferences: no flattery; probe both sides for errors; label estimates
  and assumptions; illustrate math with code; diagrams welcome; concise.

## Conventions used in every file here

- Coordinates: x aft-positive along the hull (bow at x=0, transom at 10),
  y to starboard (centreplane is y=0), z up. Demo hull is 10 m.
- Demo chine polyline V (starboard): (0,0,0.9) (2.5,0.85,0.35) (5,1.3,0.1)
  (7.5,1.3,0.05) (10,0.9,0.15). Segment V2–V3 has equal half-breadths, so it
  is the cylinder (apex at infinity) case. V0 is on the centreline (stem head).
- Frames/sections are sampled NP=13 points per half, NU=2*NP-1=25 full,
  ordered starboard chine (k=0, u=1) → keel (k=12, u=0) → port chine.
- u ∈ [0,1] along a seam, 0 at keel, 1 at chine.

## Geometry results (derived in chat; the ones marked [numerical] were only
## checked on the demo hull, the rest are arguments)

1. Apex. For a chine segment A→B and its mirror, the two lines meet on the
   centreplane at t = −y_A/(y_B−y_A), i.e. P = A + t(B−A). If y_A = y_B the
   pair is parallel → generalized cylinder with rulings ∥ (B−A). Handle that
   branch explicitly.

2. The chine segment is a RULING of the cone, not a curve crossed by rulings.
   Consequence: every transverse section of one cone patch is a homothetic
   copy (scaled about P) of every other. A single "master frame" (directrix)
   fixes the whole patch: point Q at station x maps to
   Q + t·(Q−P), t = (X − Q.x)/(Q.x − P.x). Cylinder: t along (B−A).

3. A plane containing a line and its mirror image is invariant under the
   reflection, hence perpendicular to the centreplane, hence horizontal in
   section. That is why the flat loft has zero deadrise.

4. Line-on-developable fact (checked against the cone case and the tangent
   developable case; it is standard): a non-planar developable contains a
   straight line only as a ruling. So along a straight chine segment the
   tangent plane is constant (either the segment is a ruling or the surface
   is planar there). Smoothness at a chine vertex would need
   span(prev,AB) = span(AB,BC) → three consecutive segments coplanar.
   ⇒ A polyline chine with real corners cannot bound a G1 developable.
   Seams at chine vertices are creases no matter how they are shaped.
   [numerical] fold along seams on the demo hull: ~6°–12°, barely affected by
   seam tilt (±45° changed it by ~1–2°) or by free-form seam shape.
   Why: fold at the chine end is set by the chine corner + frame tangent,
   fold at the keel end by the change in keel slope; a seam only changes
   what happens between.

5. Dichotomy for a SYMMETRIC, REGULAR (no crease) developable spanning chine
   to mirrored chine: the ruling through a keel point is its own mirror image,
   so it is transverse (∥y) or lies in the centreplane; type is constant along
   the keel by continuity. Transverse everywhere ⇒ surface is the cylinder
   z = z_keel(x), flat sections, zero deadrise. In-centreplane ⇒ the keel is
   one straight ruling (cone from a centreplane apex, cylinder, or tangent
   developable of a symmetric edge crossing the centreplane outside the hull).
   ⇒ Either flat sections or a straight keel. Curved sections + rocker +
   no keel fold is impossible for a single smooth developable.
   OPEN CHECK for the user's tool: what does its spline-chine bottom look
   like? Prediction: zero-deadrise cylinder, or if it looks like a V with
   rocker it is not developable / has a hidden keel fold. For a quadratic
   chine y=a s², z=b s² the coplanarity determinant factors as
   4ab·σ·s·(σ−s): only the mirror pairing (cylinder) and the stem-apex cone.

6. Keel under the cone chain (apex on centreplane) is a ruling through P_j,
   so it is one straight line per chine segment. Sub-dividing a chine segment
   adds NO keel freedom (all sub-panel keel lines pass through the same P_j).
   Keel vertices exist only under chine vertices.

7. Refining a spline chine into many cone panels does NOT converge to a
   developable. [numerical, experiments/refine_polyline_chine.py] sum of keel
   folds over all seams stays ~50–70° for 4…64 segments. The limit surface
   (homothetic curved sections + curved keel) is doubly curved by (5); the
   Gaussian curvature lives in the creases. Fine as a preview of a doubly
   curved intent, wrong as a plate layout.
   REVISED 2026-09-09 after user pushback ("8 segments looks better than 4 and seems
   buildable"): the limit is not developable, but every finite N is exactly buildable as N
   cone plates; the creases are permanent (never fair out) and N is a BUILD trade (welds,
   fairing, visible knuckle ~ total/N), not a hydrodynamic one. See item 17.

8. Off-centreplane apex (apex anywhere on the extended chine line): the keel
   becomes cone ∩ centreplane (a curve) and port/starboard meet there with a
   fold that is exactly 0 at the master frame's keel point (frame tangent is
   transverse there) and grows toward the seams (~4° on the demo). The user
   tried this (page 02) and REJECTED it as ugly. Do not re-propose.

9. Keel-seam V-bottom (standard developable-hull construction): chine-to-keel
   developables port and starboard, crease along the keel and chines, smooth
   between. Needs a spline chine (a straight chine segment forces a cone with
   apex on the chine line — item 8).

10. Correction log (things I said in chat and later withdrew — don't repeat):
    - "with a keel seam, the keel is whatever the authored keel cuts on the
      cone" — wrong; the cone still needs a directrix (master frame), keel is
      derived.
    - "a straight chine segment forces the panel to be a cone or cylinder" —
      too strong; tangent developables also have straight rulings (skew to
      each other). Cone = the case where chine ruling and keel ruling meet.
    - "rulings could depart from the apex fan near the seam to smooth it" —
      impossible by item 4.

17. Wave drag vs refinement [numerical, experiments/michell_refinement.py, ~4 s]. Michell
    thin-ship integral (Tuck form, lambda=cosh t substitution) for the smooth test chine of
    item 7 cut into N cones, round-bilge frame, drop 0.35, waterline z=0.3, vertical
    topsides chine->waterline, 801 stations x 90 waterlines. R_w(N)/R_w(256) at
    Fr 0.25/0.35/0.50: N=4 1.11/0.94/0.85, N=8 0.97/0.98/0.96, N=16 0.99/0.99/0.99,
    N=32 1.00/1.00/1.00. Converges ~h^2 (offset error to the limit 0.64/0.29/0.13/0.06 m).
    N=4 differs mainly because it is a smaller hull (wetted half-area 3.6 vs 4.1 m^2), not
    because of creases. Michell does NOT support "more segments -> more drag"; the argument:
    integration by parts makes the amplitude the transform of OFFSETS, so slope kinks are
    harmless (only offset jumps/transom steps diverge), and the N kinks are a Riemann sum of
    the smooth curvature. Extra seams cost viscous/roughness drag (welds) and fairing work.
    Grid check: ~1% absolute discretization error, common to all N. Thin-ship is qualitative
    for B/L 0.26.

18. Master frame family (page 05, 2026-09-09): cubic Bezier keel->chine with tangent ANGLE
    (from the across axis) and handle length (fraction of chord) at each end: {thK,aK,thC,aC}.
    Presets: straight V (aK=aC=0); round bilge (0,0.32,90,0.09) = old fullness 0.6; flared =
    hollow to the chine (35,0.35,0,0.35): keel knuckle 2*thK=70 deg in every frame, flattens
    outward; S (0,0.35,-10,0.30): convex bilge + reverse curve at the chine (z not monotone).
    thC below the chord angle = flare. The user asked for "more interesting master curves,
    like something that adds some flare".

19. The free seam, used (page 05 section 5, 2026-09-09, after the user: "you mention that the
    seam curve is free but you don't really do anything with that"). The next cone is fixed by
    its apex + the seam, so the seam IS the shape control of the next cone. Equivalent, and
    more useful, formulation: ONE FRAME PER CONE (cone j's frame drawn at V_{j+1}/K_{j+1} in the
    inclined plane, own {thK,aK,thC,aC}), seams DERIVED as cone∩cone. Adjacent cones share two
    POINTS, V_v and K_v (NOT a ruling: cone v-1's chine ruling is V_{v-1}V_v, cone v's is
    V_vV_{v+1}); both keel lines pass through K_v. The surfaces cross at the fold angle, so the
    intersection is a well-defined curve V_v -> K_v.
    [numerical, 2026-09-14] How free: scan of cone 2's frame over thK 0-60, aK 0-0.7, thC -30..90,
    aC 0-0.6 with round neighbours: a seam EXISTS almost everywhere; failures only at extremes
    (thK 60 + aK>=0.6: cones miss along rulings; thC -30 + aC>=0.45: seam outside the chine;
    biggest handles: seam past the neighbouring station). Excursion = dz/tan(min fold) holds to
    ~10% (e.g. dz 3.9 cm, fold 5.9 deg -> predicted 38 cm, measured 36). Deep-V keel (thK 45,
    aK 0.45) moves seams 1.4-1.7 m on a 2.5 m segment. Prerequisite for a determinate seam:
    fold bounded away from 0 along it, i.e. keel knuckle != 0 and chine frame tangent NOT in the
    plane of the chine corner (if T_c lies in span(V_v-V_{v-1}, V_{v+1}-V_v) the fold at the
    chine end vanishes and the seam is undetermined there; for V2 that T_c is ~(0,0.45,-0.20),
    a reverse-curve arrival, thC ~ -24 deg). Seam freedom and next-frame freedom are the SAME one
    function of u: free-form seam => non-Bezier next sections; Bezier next frame => seam derived. Implementation (multiChain in the page): along each ruling of
    the aft cone, signed distance (in the station plane) to the forward cone's section, bracket
    80 samples over [x_{v-1}-0.3, x_{v+1}+0.3] + bisection; checked from the forward cone's
    rulings too (agree). Identical frames -> transverse seams (excursion ~1 mm).
    [numerical] GEARING: seam fore-and-aft excursion / section-shape difference at x_v ~= 1/tan(fold)
    = 7-9 : 1 on the demo (fold 6-9 deg). E.g. cone 3 keel handle 0.32 -> 0.50: shape change
    2.4 cm, seam moves 22 cm. Section shape CAN vary along the hull (flared fwd, round mid, flat
    aft) but only mildly per seam; big differences push seams past neighbouring stations, outside
    the chine (plate would poke through the topsides), or make the cones miss along some rulings
    (all flagged). Page-04 rake/bulge = same freedom from the seam side, hence "big bulge, small
    shape change". Constraint noted: near the chine the seam must stay ~transverse, because
    either cone's chine ruling extended past the vertex lies outside the true chine.

20. Visualisation (2026-09-09, user: "the current 3d views don't show it very well. traditional
    lines drawings might work better? or something shaded"). Page 05 fig 9 now has (a) flat-shaded
    quads in the orbit viewer (View3D items {t:'quad'}, painter's sort along the into-screen
    vector, light from upper-left-front, two-sided), with a "From below" preset; (b) a traditional
    lines drawing of the bottom (drawLines): profile with buttocks + half-breadth plan with
    waterlines stacked at one scale, body plan below at ~2.4x with bow half right / stern half
    left, seams/chine/keel/frames overlaid. Built from a fine mesh of the multi-frame chain
    (meshMulti: 36 u x 24 s per cone, boundary x interpolated in u from the 13 pierced rulings)
    and plane contouring on quads (contourMesh). Seams show up as the non-station curves in
    profile/plan and as shading breaks in 3D. Only fig 9 is shaded; fig 7 (design) is still
    wireframe (multiChain has no seam bulge, so it cannot yet replace coneChain there).

## Chosen design (user's decision, page 04)

- Apexes pinned exactly on the centreplane (no keel fold).
- Master frame: cubic Bézier half-section from keel to chine, one "fullness"
  parameter f (f=0 straight V with a keel knuckle; f>0 horizontal tangent at
  keel). Drawn in the inclined plane through the chine vertex, its mirror and
  its keel vertex (the keel vertex is generally raked off the station).
- Keel polyline authored as: master vertex height + fore/aft rake of each
  interior keel vertex. Each keel line passes through its apex P_j and the
  vertex nearer the master; the next vertex's height follows. Stem vertex is
  the chine's stem point because P_0 is that point. Keel drop derived.
  (Authoring heights instead was tried — page 03 — and is badly conditioned:
  keel vertices are intersections of near-parallel lines.)
- Seams: transverse by default, with a per-seam "mid bulge" (quadratic in u,
  fixed at chine and keel ends). Inner shift = rake.
- Warnings: keel vertex raked past a neighbouring chine station; vertical
  keel line.
- Unrolled plates: cone → polar coords about the apex (radius = distance to
  P, angle = accumulated angle between successive rulings at P); cylinder →
  (distance along ruling, arc length across). Take ruling direction from the
  end farther from P (the stem cone is degenerate at its apex).

## Hybrid: cone chain AFT, keel-seam V-bottom FORWARD (answered 2026-09-08)

Question: transition at a chine vertex B; forward half-panel = the tool's two-curve
developable loft between the forward (spline) chine and a COMPOSITE lower curve =
seam on the last cone (B -> K_s) then the authored forward keel (K_s -> stem).
Prototype: experiments/forward_loft.py (pairing det(T_lower,T_chine,chord)=0 by
bracketing+bisection, traced per piece of the lower curve). All [numerical] on the
demo hull, B=V2, forward chine = cubic Hermite in x, forward keel = cubic Hermite
z(x) with authored slope kB at K_s and k0 at the stem.

11. The seam piece always pairs cleanly: monotone, unique, ends at K_s paired with
    the chine point whose PROFILE tangent passes through K_s (because the master
    frame's tangent at the keel is transverse, the last seam ruling lies in a plane
    containing y). Demo: chine x=1.93. Fold between aft cone and forward panel along
    seam B: 0.5-8.5 deg (same order as cone-chain seams).

12. The corner K_s is the whole problem. The keel branch of the pairing starts at
    the chine point set by the keel TANGENT at K_s. Only one slope ("matched" slope
    = slope of the chord K_s -> that chine point, demo -0.173) puts it where the seam
    branch ended. Flatter keel (incl. G1 continuation of the aft keel line, -0.020):
    the keel branch starts back near B, so keel rulings cross seam rulings -> no
    developable. Steeper keel: keel points just forward of K_s have NO coplanar
    partner at all (the tangent planes along the keel look past the chine). The
    "small cone-fan at K_s" predicted earlier does not rescue either case.
    => The forward keel's slope at K_s is DERIVED, not authored (same lesson as the
    cone chain). Keel knuckle at K_s vs the aft keel line: ~8.6 deg on the demo,
    consistent with the cone chain having keel knuckles under every chine vertex.
    Keel fold at K_s is then exactly 0 and grows forward (item 14).

13. Second condition: keel CURVATURE near K_s. With the matched slope, the stem
    slope k0 (which sets the curvature) has a feasible band: demo k0 in about
    [-0.34,-0.26]. Flatter (k0 >= -0.24): the chine is exhausted before the keel
    (keel tail from x~3.4 forward unpaired). Steeper (k0 <= -0.40): pairing folds
    back near K_s (rulings cross). Inside the band: monotone, every keel point
    paired, edge of regression outside the panel everywhere. So the hybrid IS
    feasible, but the authored keel is a constrained curve: slope at K_s derived,
    curvature in a band, and it must arrive at the stem together with the chine.
    Transition at V1 (B=V1) found no feasible k0 in a coarse scan (-0.3..-0.8);
    not proven infeasible.

14. Forward keel fold inside the band (2*deadrise, demo): 0 at K_s, then at
    x=4/3/2/1: k0=-0.34: 3/10/18/27 deg; k0=-0.30: 9/18/27/37; k0=-0.26: 15/29/40/49.
    Max ~37-55 deg at the stem. k0 is effectively the forward-deadrise control.

15. Tried and dropped: authoring the tangent-plane tilt along the forward chine and
    deriving the keel as the envelope's trace on the centreplane. Mathematically the
    tilt is the one free function, but the keel foot position is hypersensitive to
    the tilt RATE (feet ran off to x~1000 for smooth tilt schedules). Author the
    keel curve under the constraints of items 12-13 instead.

16. Correction log additions:
    - "the loft will put a small cone-fan at the seam/keel corner K_s" - wrong on
      the demo; mismatched corner slope gives crossing or unpaired keel, not a fan.
    - "keel fold starts at zero at K_s" - true only with the matched slope; for
      other slopes there is no developable at all.
    - (page 05 section 5, first version) "adjacent cones share the chine segment, a ruling of
      both" - wrong, they share only the chine vertex and the keel vertex; fixed 2026-09-14.
    - unroll orientation sign `P.x < V_j.x ? 1 : -1` mirrored the STEM plate end for end (apex
      == forward vertex). Fixed to `<=` in pages 04/05/06 (2026-09-14); pages 01-03 still have it.
    - the coincidence kB = dzB in the baseline (cylinder aft: keel line parallel to
      the chine) makes det vanish exactly at (K_s, B); handle endpoint roots.

Suggested next step: page 05 = page 04 aft of V2 + forward panel from the
prototype (sliders: forward chine slopes, drop, k0 within the band; derived kB;
report fold along the forward keel; unrolled forward plate needs the general
developable unroll, not the cone polar unroll).

## Repo layout

Published: GitHub repo risingtideresearch/hull-cones, GitHub Pages serves index.html (the
authoring tool) from the main branch root (set up 2026-09-14).

- pages/01-cone-chain.html      master frame + free-form seams + unrolled plates
- pages/02-free-apex-keel-fold.html   rejected variant, kept for reference
- pages/03-authored-keel-heights.html  keel by heights (ill-conditioned)
- pages/04-authored-keel-rake.html     CURRENT design
- pages/05-explainer.html   interactive explainer of the CONE CHAIN only (items 1-7, 9-10,
  17-20, chosen design), 2026-09-09. 9 live figures (fig 9 = one frame per cone, derived seams, shaded + lines drawing): flat loft, apex, one cone + frame
  presets, 8-step construction walk-through (prev/next, seam rake + master rake sliders),
  creases + "split a segment" demo (item 6), heights-vs-rake conditioning (profile), page-04
  design + unrolled plates with the general frame, refinement folds + Michell ratios
  (hardcoded from michell_refinement.py). The user asked to drop the hybrid (items 11-16):
  "too much", "not easy to follow or convincing"; then asked for "a lot more exposition
  around how the chain of cones is constructed" (-> section 4) and flare (-> item 18).
  Page is assembled from scratch pieces (head/body/shared.js/figs.js) but is one file.
- index.html (was pages/06-authoring.html)   AUTHORING TOOL (2026-09-14, user request). Sections: (1) chine +
  keel: profile and plan canvases with draggable chine vertices (stem on centreline, stem/stern
  stations fixed) and keel vertices (drag sideways = rake, up/down = height; the last-dragged
  vertex becomes the authored one, st.m), frame-plane traces K->V in blue; (2) frames: body
  plan with ONLY the 4 Bezier frames (user: "drop all the other lines"), drag the two handles,
  no sliders (user: "just a Reset to round button", resets the SELECTED frame); (3) shaded 3D,
  single colour, no overlay lines by default (user: "just shaded", "drop the tint"), no view
  preset buttons, orbit about the model centre, wheel zoom, shift-pan; no lead/note paragraphs;
  (4) unrolled plates (rows along each cone's own rulings, incl. the plate's frame dashed).
  The lines drawing was removed from the tool at the user's request (3D + unrolled only).
  State {V, frames, m, kz, rake} as JSON textarea + localStorage 'hull-cones-06'.
  STEP EXPORT (2026-09-14): AP214, metres, one OPEN_SHELL of 2N ADVANCED_FACEs (stbd+port).
  Each plate = exact B_SPLINE_SURFACE_WITH_KNOTS degree (3,1): control net = frame Bezier
  control points mapped by the homothety about the apex (or translated along the cylinder
  direction) at two ruling parameters lam0/lam1 spanning the plate (+2% margin; stem cone keeps
  lam0=0 so the apex row is degenerate). Trimming edges: chine ruling and keel ruling as degree-1
  B-splines, seams as clamped cubic B-splines interpolated (chord-length, Piegl&Tiller 9.1)
  through 97 seam points sampled by multiChain(...,res=96); seam and keel EDGE_CURVEs are shared
  between adjacent faces, vertices shared via a registry. Uncertainty 1e-4 m. Self-check in node
  (scratch chk2.js): sample points on both cones to 0 µm, interpolated seam midpoints within
  36 µm (res 96; 521 µm at res 24), all entity refs resolve; export ~2 s.
  RHINO BUG FOUND + FIXED (2026-09-14): first version imported with "weird artifacts" (complement
  regions, lens-shaped ears). Cause: STEP outer loops must run COUNTER-CLOCKWISE in the surface's
  (u,v) parameter space; mine did only for stbd plates whose ruling parameter increased aft. Fix:
  order the two v-columns by x (v increases aft on every face) and reverse u (chine->keel) for
  port control nets so the port loop order (seam, keel, seam, chine) is CCW and normals stay
  outward. VERIFIED with OpenCASCADE DRAWEXE (brew install opencascade; /opt/homebrew/bin/DRAWEXE
  -b -f script.tcl: pload XDE OCAF MODELING; stepread; checkshape; nbshapes; bounding -optimal;
  sprops): valid shell, 8 faces / 22 edges / 13 vertices, tight bboxes = plates, face areas match
  the tool's mesh areas within 0.15%. OCC converts to mm on read (fine). Demo: bottom-demo.step.
  UI (2026-09-14): "reset all to round" resets every frame; default keel z KZ0=-0.9 (was -0.25).
  Also fixed: sd() now refines the nearest point on the exact Bezier section (golden section)
  after the 40-segment polyline search, in pages 05 and 06. Its shared JS (helpers, View3D,
  coneChain, frameControls, multiChain, mesh/contour/drawLines) is a COPY extracted from page
  05's script (everything before '// ---- fig 1'); fixes to that code must go to both pages.
- experiments/seam_tilt_fold.py    seam tilt vs fold angle (numpy)
- experiments/refine_polyline_chine.py   refinement experiment (item 7)
- experiments/forward_loft.py   hybrid forward-loft pairing prototype (items 11-16); ~5 min
- experiments/michell_refinement.py   Michell wave resistance vs N cones (item 17), numpy 2 (trapezoid)
- experiments/forward_loft.js   node port of the above (runHybrid), same numbers, ~50 ms/case;
  `node experiments/forward_loft.js` prints the cross-check table
- test/strict_dom_check.js   node harness: evals a page's script with a DOM
  stub that only knows ids present in the HTML (or injected via innerHTML);
  `node test/strict_dom_check.js index.html`. Concatenates all
  <script> blocks, reads slider/select defaults from the HTML, optional 3rd arg = extra JS
  to run after the page (used for numeric cross-checks). Page 04 prints MISSING b0/b4:
  pre-existing and guarded in that page's seamX.
  A permissive stub hid a null-element bug once — keep it strict.

All pages are self-contained HTML/canvas, no dependencies, no build step.
Python experiments need numpy only.
