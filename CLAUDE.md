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

21. Chord deadrise beta = atan((z_V - z_K)/y_V), i.e. the angle of the straight chord keel->chine in a station
    (2026-09-14, page 07). The chine segment and the keel line of one cone are both RULINGS THROUGH THE SAME APEX, so
    the triangle P-V(x)-K(x) is a homothety of itself at every station and beta is CONSTANT ALONG EACH CONE:
    tan beta = (dVz/dVx - dKz/dKx)/(dVy/dVx). Equivalently the keel is just the chine pulled down by y*tan beta,
    z_K(x) = z_V(x) - y_V(x)*tan beta; [numerical] that one formula reproduces the tool's keel polyline to 4e-16 m.
    => equal beta on every cone <=> zero rake. The tool's default keel (kz -0.9, no rake) is a constant 37.57 deg
    chord-deadrise bottom end to end, and the keel's one remaining DOF at rake 0 IS beta.
    Rake is exactly the freedom to let beta vary. beta(x) is a staircase: flat over each cone, with a ramp between a
    chine vertex and its raked keel vertex (in that window the keel comes from one cone, the chine from the other).
    AUTHORING CHART: one beta per cone = N numbers for the keel's N DOF, complete and rake-free, dual to the current
    chart (vertices authored, beta derived). On a cone beta is a re-unit of the keel line's SLOPE (direction-type);
    on the cylinder segment, where the direction is frozen, y_V is constant and the same formula becomes a pure
    translation. It is the only handle tried that survives both branches and the short stem-cone lever arm.
    [numerical, demo] gearing 2.4-3.6 cm of keel depth per degree on all four cones (vs 12-14 cm/deg for the keel
    knuckle angle, 8-14 cm/deg for raw keel slope); 1 deg of beta mismatch between neighbours moves the shared keel
    vertex 10-20 cm fore/aft, so the existing "vertex past a neighbouring chine station" warning becomes a bound of
    roughly 12-25 deg on how fast deadrise may change from plate to plate. Added warning: keel vertices out of order.
    beta is blind to the four frame parameters; the TANGENT deadrise at the keel tau is not, and tau jumps at every
    vertex (it belongs to whichever cone owns the station). With the straight-V frame the cone degenerates to a plane
    and tau = beta to 2e-6 deg - the cross-check that the two are computed independently.

22. Inverse chart + trimmed edge — the tool's ONLY mode since 2026-09-14 (user: "I want to author the keel
    points and the plan chine, and this spline, as the only mode").
    AUTHORED: the keel polyline (x,z of every vertex, no rake, no master), the chine IN PLAN (x,y), the four
    frame parameters per cone, and a trim spline z = f(x). DERIVED: the chine's z, the apexes, the seams, and
    the real edge of the bottom.
    (a) Chine z. Each keel line must pass through its cone's apex. Written as
        y_{j+1}(z_j - L_j(x_j)) = y_j(z_{j+1} - L_j(x_{j+1})), one linear equation per cone, singular NOWHERE
        (the cylinder branch reads z_{j+1}-z_j = s_j(x_{j+1}-x_j)). Bidiagonal => a forward sweep, no solve.
        y_0 = 0 collapses equation 0 to z_0 = L_0(x_0) (the chine's stem point IS the keel's forward end), so
        the one free number is z_1. Sweep gain y_{j+1}/y_j, telescoping to y_N/y_1 = 1.06 on the demo; it blows
        up only if a chine vertex approaches the centreline (gain 26 at y_1 = 0.05) - warned below y = 0.05.
        The leftover freedom is EXACTLY the shear z -> z + lambda*y: an affine map fixing the centreplane
        pointwise, so it maps cones to cones, leaves the keel and the plan untouched, and shifts every cone's
        tan(beta) by lambda. In the UI it is dragging any chine vertex up or down.
        [numerical] reproduces the old default chine to 6e-9 m; every apex lands on its keel line to 3e-16 m.
    (b) Trim. The edge of the bottom is a curve ON the cones, so it has exactly ONE free function: you can fair
        its profile or its plan, not both. REVISED 2026-09-15 (user: "a version where the plan view is an
        approximating spline and the profile chine is derived", then chose the trimmed edge + replace):
        it is now authored in PLAN as y = g(x) and its PROFILE is derived. g is a clamped cubic B-spline,
        APPROXIMATING, sampled to a 1200-point y(x) lookup; the edge is cones n {y = g(x)}, one monotone
        bisection on y per station (needs half-breadth monotone along the section - the existing "frame
        overhangs" warning covers it).
        The CHINE PLAN POLYLINE IS THE CONTROL POLYGON - one set of handles, no separate control points
        (2026-09-15, user: "too complicated to have the spline handles be separate from the construction
        handles ... just approximating spline for the construction points"). That is why the spline has to be
        approximating rather than interpolating: a B-spline lies in the convex hull of its control points, so
        the edge is inside the chine automatically, and the stem (0,0) and transom vertices are interpolated
        because the spline is clamped. g is still clamped to [0, y_chine] for the one case that escapes it, a
        CONCAVE run of the plan polyline, which warns as well (a test dent at V2 put the raw spline 145 mm
        outside; the clamped edge stayed at 0.000 mm).
        A first attempt gave the spline its own 7 control points; dropped, but see the cost below.
        The FIRST version (2026-09-14) authored it in profile instead, as a natural cubic z = f(x) through one
        knot per chine station given as a drop below the derived chine. Dropped, but the lesson is kept: it
        needed f clamped to min(f, chine) with NO warning, because between knots a spline through the chine
        vertices pokes a few mm above a non-convex chine profile on almost any edit (user 2026-09-15: "the text
        below the plan is now always red" - that warning was the cause). Continuity across a seam is free: the seam point with z = f(x) lies on
        both cones, so it is the trim point of both - the tool finds that corner once on the seam polyline and
        snaps both plates to it (gaps 0.00 mm; without the snap, 13-point seam sampling left 2-40 mm).
        The chine polyline survives only as the construction line that fixes the apexes.
    [numerical, demo] WHICH VIEW YOU FAIR IS A REAL TRADE, and the plan side is the more expensive one:
      profile-faired (z = f(x) through the chine vertices): 7.6 / 2.6 / 1.1 / 0.5 % of the half-plate AREA
        trimmed off, forward to aft - the spread is the frame's chine tangent angle thC, since vertical at the
        chine (thC 90) means a z drop costs almost no plate and flat at the chine (thC 10, cone 0) costs a lot;
        the PLAN corner at each chine vertex then gets WORSE, -8.6 -> -26.6 deg at V1.
      plan-faired (y = g(x), the current mode): 4.7 / 6.9 / 9.5 / 3.7 %, 6.2 % overall - more even fore and
        aft than the profile-faired case, because the cost no longer keys off thC; the PROFILE then kinks at
        the seams by 11.8 / 15.9 / 14.2 deg, a bigger and more visible break than the plan corners were.
        COST OF SHARING THE HANDLES: with 7 control points of its own the spline hugged the polygon better and
        lost only 3.8 / 2.7 / 5.2 / 3.1 %, 3.7 % overall. Collapsing to the 5 chine vertices costs 2.5 points
        of plate, because a stiffer B-spline sits further inside its control polygon. The fix is more chine
        vertices (= more cones), which couples plate count to both fairness and yield - the tool's NCONE is
        fixed at 4 by PLAN0, so that is not draggable yet.
    Latent bug fixed 2026-09-15: the "apply" handler still validated o.drop after the trim became a plan spline,
  so pasting valid state was rejected.
  VERIFIED (plan-trim version): the edge is on y = g(x) to 3e-14 m everywhere except the two snapped seam
    corners, which come from the 13-point DISPLAY seam and are 2-12 mm off; the STEP export re-finds them at
    res 96 to within 4 um. Unroll is an isometry to 0.04%; 8 faces / 13 vertices / 0 unresolved refs; outer
    loops counter-clockwise in (u,v) on BOTH sides, checked directly by signed area in parameter space
    (OpenCASCADE is no longer installed on this machine, so DRAWEXE could not be re-run).
    update() costs ~215 ms, of which multiChain is 169 ms (pre-existing); trimCurve is 2 ms.

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
    - the STEP transom edge was a straight line from the chine vertex to the keel vertex; the transom boundary
      is the cone's SECTION there, which is only straight for a straight-V frame. Fixed 2026-09-14: it is now a
      cubic B-spline through the sampled section, like the seams.
    - (2026-09-14, chat) "chord deadrise is a position-type parameter, same class as depth at a station" - wrong:
      on a cone it is a re-unit of the keel line's SLOPE, because both boundary curves are rulings through the apex
      and the angle is scale-invariant. Position-type only on a cylinder segment. See item 21.
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
- index.html (was pages/06-authoring.html)   AUTHORING TOOL. Rewritten 2026-09-14 to ONE mode (item 22).
  Sections: (1) keel, plan and trim: profile canvas with draggable keel vertices (x and z, both authored),
  the derived chine drawn as a dashed construction line whose vertices drag to shear (st.z1), and the edge's
  DERIVED profile drawn heavy; plan canvas with the edge's approximating B-spline drawn heavy, its control
  points draggable - which ARE the chine vertices, drawn hollow with the control polygon dashed behind; (2) frames: body plan, drag the two handles per frame, "reset all to round",
  the part of each frame beyond the trim drawn faint with the trim point marked; (3) shaded 3D, quads clipped
  at the trim, orbit/wheel-zoom/shift-pan, NO overlay lines at all unless "lines" is ticked (2026-09-15, user:
  "the chine line on the 3d view is not needed" - the trimmed edge used to be drawn unconditionally);
  (4) unrolled plates, outline cut at the trim. The readout colours only the WARNING lines, not the whole block.
  State {plan, keel, z1, frames} as JSON + localStorage 'hull-cones-09' (key bumped each time the shape
  changed; '-06' through '-08' state is not readable).
  STEP EXPORT: AP214, metres, one OPEN_SHELL of 2N ADVANCED_FACEs. Each plate is still an exact
  B_SPLINE_SURFACE_WITH_KNOTS degree (3,1) (frame Bezier control net mapped by the homothety about the apex,
  or translated along the cylinder direction, at two ruling parameters +2% margin; the stem cone keeps lam0=0).
  Outer loop is now (trim curve, aft seam, keel ruling, fwd seam) - the chine ruling is gone. Seams and the
  transom edge are truncated at the trim; the trim curve is a clamped cubic B-spline interpolated through ~100
  sampled points; the trim/seam corner is a shared vertex. Uncertainty 1e-4 m, export ~1.4 s.
  RHINO ORIENTATION RULE STILL HOLDS: STEP outer loops must run COUNTER-CLOCKWISE in the surface's (u,v)
  parameter space - v increases aft on every face, u is reversed (chine->keel) for port control nets.
  test/strict_dom_check.js covers it; the scratch checks that went with the rewrite verified the chine solve,
  apex-on-keel-line, seam snapping, unroll isometry, STEP accuracy and loop orientation.
  Its shared JS (helpers, View3D, keelBase/multiChain, meshMulti) is no longer a clean copy of page 05's:
  View3D shades any polygon (Newell normal, for trimmed quads), multiChain takes an AUTHORED keel
  (multiChain(V, frames, kv, res)) instead of (m, kz, rake), and the page-05-only code (coneChain, chainItems,
  drawLines, contourMesh, frameControls, meshQuads, clipPoly/clipSeg) has been deleted here. Page 05 still has
  the original versions; fixes must be ported by hand, not copied.
- pages/07-chord-deadrise.html  chord deadrise: what the angle is in section, that it is constant per cone,
  and the one-beta-per-cone chart (item 21), 2026-09-14. Self-contained; carries its own small copy of the chine /
  keel / frame-Bezier / cone-section geometry (not the full shared JS of pages 05-06).
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
