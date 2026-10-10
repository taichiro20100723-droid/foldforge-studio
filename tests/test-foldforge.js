"use strict";

const assert = require("assert");
const F = require("../foldforge-core.js");

function area2(P) {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}

function minClearance(panels) {
  const cell = 8, grid = new Map(), step = 0.4;
  panels.forEach((pn, i) => {
    for (const outline of [pn.lower, pn.waist, pn.top]) {
      if (!outline) continue;
      for (let k = 0; k < outline.length; k++) {
        const a = outline[k], b = outline[(k + 1) % outline.length];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const m = Math.max(1, Math.round(L / step));
        for (let q = 0; q < m; q++) {
          const pt = [a[0] + (b[0] - a[0]) * q / m, a[1] + (b[1] - a[1]) * q / m];
          const key = Math.floor(pt[0] / cell) + ":" + Math.floor(pt[1] / cell);
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push([i, pt]);
        }
      }
    }
  });
  let worst = Infinity;
  for (const [key, items] of grid) {
    const gp = key.split(":").map(Number);
    const near = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const o = grid.get((gp[0] + dx) + ":" + (gp[1] + dy)); if (o) near.push(...o);
    }
    for (const [i, a] of items) for (const [j, b] of near) {
      if (i === j) continue;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d < worst) worst = d;
    }
  }
  return worst;
}

let conversions = 0;
const report = [];
for (const example of F.EXAMPLES) {
  for (const mode of ["elastic", "exact"]) {
    const source = example.make(); source.name = example.id;
    const result = F.processMesh(source, { mode, targetSize: 100, panelLimit: 54, bedSize: 256, fabricMargin: 30, trials: 10, seed: 7 });
    const tag = example.id + "/" + mode;

    assert(result.print.panels.length > 0, tag + ": no panels");
    assert.strictEqual(result.audit.openOrNonmanifoldEdges, 0, tag + ": open or non-manifold edges");
    assert(result.audit.watertightPanels, tag + ": print mesh is not watertight");

    const b = result.audit.bounds;
    assert(Math.abs(b.size[2] - result.options.thickness) < 1e-4, tag + ": thickness is " + b.size[2]);

    const clear = minClearance(result.print.panels);
    assert(clear >= 0.30, tag + ": panels only " + clear.toFixed(3) + " mm apart");
    report.push([tag, result.print.panels.length, clear]);

    for (const pn of result.print.panels) {
      assert(area2(pn.waist || pn.top) > 1.0, tag + ": panel below 1 mm2");
    }
    for (const panel of result.print.panels) for (const p of panel.top) {
      assert(p[0] >= -1e-5 && p[0] <= 256.00001 && p[1] >= -1e-5 && p[1] <= 256.00001, tag + ": outside bed");
    }

    const stl = result.exports.printSTL();
    assert.strictEqual(stl.length, 84 + result.print.triangles.length * 50, tag + ": binary STL size");
    assert(F.parseSTL(stl).faces.length > 0, tag + ": STL roundtrip");
    const fold = JSON.parse(result.exports.fold());
    assert.strictEqual(fold.file_spec, 1.1);
    assert(result.exports.svg().includes("<svg"));
    assert.strictEqual(JSON.parse(result.exports.assembly()).summary.panels, result.assembly.summary.panels);
    conversions++;
  }
}

const tri = [[[0, 0, 0], [10, 0, 0], [0, 10, 0]]];
const ascii = Buffer.from("solid x\n facet normal 0 0 1\n outer loop\n vertex 0 0 0\n vertex 10 0 0\n vertex 0 10 0\n endloop\n endfacet\nendsolid x\n");
assert.strictEqual(F.parseSTL(ascii).faces.length, 1, "ASCII STL parser");
assert.strictEqual(F.parseSTL(F.binarySTL(tri, "test")).faces.length, 1, "binary STL parser");

const inset = F.insetTriangle([[0, 0], [10, 0], [0, 10]], 1);
assert(inset.usedDistance > 0 && inset.usedDistance <= 1.0001, "insetTriangle clamps");

{
  const poly = [[0, 0], [40, 0], [0, 40]];
  const mk = (kind) => F.panelSolid(poly, poly.map(() => ({ kind: kind, cells: [] })),
    { mid: 0.5, mTop: 1.1, vBot: 0.45, thickness: 0.8, l1: 0.2, l3: 0.6, amp: 0 });
  const M = mk("M"), V = mk("V");
  assert(M && V, "panelSolid failed");
  assert(area2(M.top) < area2(M.waist) - 0.5, "mountain: L4 must be set back");
  assert(area2(V.lower) < area2(V.waist) - 0.5, "valley: L1 must be set back");
  assert(Math.abs(area2(M.waist) - area2(M.lower)) < 1e-6, "mountain: L1 and L2/L3 must be flush");
  assert(Math.abs(area2(V.waist) - area2(V.top)) < 1e-6, "valley: L4 and L2/L3 must be flush");
}

console.log("conversions", conversions, "| worst clearance", Math.min.apply(null, report.map(function (r) { return r[2]; })).toFixed(3), "mm");
console.log("OK");
