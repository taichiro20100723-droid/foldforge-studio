# FoldForge Studio — technical notes

## Pipeline

1. Parse binary or ASCII STL.
2. Weld coincident vertices with a scale-relative tolerance.
3. Remove duplicate and degenerate triangles.
4. Propagate face winding across manifold edges.
5. Normalize the target to the requested longest dimension.
6. Apply adaptive, component-aware vertex clustering when the face count is high.
7. Choose one of two layouts:
   - elastic morph: least-variance/area-normal projection, optional front-shell extraction;
   - exact net: weighted randomized spanning-tree search, intrinsic triangle unfolding, overlap scoring, greedy island splitting.
8. Pack the layout into the central bed area after reserving the fabric margin.
9. Inset each triangular panel by half the requested top gap.
10. Build a watertight two-level frustum: smaller lower half, larger upper half, with the transition beginning at the pause height.
11. Export binary STL, SVG, FOLD 1.1, and assembly JSON.
12. Audit the print mesh for degenerate triangles and non-two-manifold edges.

## Why elastic morph exists

A flat, unstretchable sheet cannot acquire arbitrary positive Gaussian curvature without cuts, overlaps, or distortion. The photographed prototype is not ordinary paper: each rigid printed island is separated by a compliant 15D tulle network. The gaps and fabric can change metric locally. Elastic mode therefore uses the target STL as a height/shape field and makes a planar panel sampling rather than claiming an exact rigid origami solution.

## Exact net objective

For a connected component, candidate dual spanning trees are scored by:

- exact 2D overlap area, with a dominant penalty;
- bounding-box area;
- total length of non-tree closure seams.

Tree edge priorities favor long, nearly coplanar shared edges and add deterministic pseudorandom jitter. If the best candidate still overlaps, a greedy traversal cuts the conflicting branch into another island. Every removed adjacency receives a matching seam ID.

## Thick/fabric panel geometry

The top polygon is inset by `gap / 2`. The lower polygon is inset by an additional `gripOverhang` per side. The lower polygon remains vertical up to `pauseHeight`; the upper half slopes outward to the top polygon. This provides:

- requested free hinge span on the visible/top surface;
- more exposed cloth below the pause plane;
- a printable overhang that mechanically captures the mesh;
- automatic corner relief because each triangle is inset independently.

## Deliberate non-features

- No printed square frame.
- No claim of guaranteed one-piece exact unfolding for arbitrary closed meshes.
- No cloud upload or server dependency.
- No automatic collision-aware folding path.
- No magnetic hardware generated inside the moving panels.

## Next research-grade upgrades

1. Quadric-error decimation with protected sharp features and component topology.
2. True Origamizer-style tucking molecules for one-sheet closed polyhedra.
3. Nonlinear inverse design that measures the real tulle stress-strain curve.
4. Collision-aware rigid-fold simulation and assembly-path planning.
5. User-painted seams and protected landmarks.
6. Curved polygon panels and hex/Voronoi remeshing instead of triangles only.
7. Two-material stiffness optimization for TPU/PETG/PLA combinations.
8. Automatic forming-jig generation.

## Validation in this package

`tests/test-foldforge.js` converts every built-in example in both modes. It checks:

- a nonzero panel set;
- 14 triangles per two-level triangular panel;
- zero degenerate output triangles;
- zero open or nonmanifold output edges;
- binary STL byte length and parser round trip;
- all top polygons remain inside the bed;
- FOLD, SVG, and assembly JSON serialization.

