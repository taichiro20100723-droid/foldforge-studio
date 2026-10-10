"use strict";

const fs = require("fs");
const path = require("path");
const F = require("./foldforge-core.js");

const outRoot = path.join(__dirname, "examples");
fs.mkdirSync(outRoot, { recursive: true });

const panelLimits = {
  cat: 96, fuchikoma: 72, fox: 96, turtle: 90, dome: 84,
  saddle: 100, wave: 108, manta: 108, helmet: 96, beetle: 96,
  heart: 96, visor: 100, spiral: 120, dragon: 110
};

const jobs = F.EXAMPLES.filter((x) => x.id !== "spiral").map((example) => ({ example, mode: "elastic" }));
jobs.push(
  { example: F.EXAMPLES.find((x) => x.id === "dome"), mode: "exact" },
  { example: F.EXAMPLES.find((x) => x.id === "fuchikoma"), mode: "exact" },
  { example: F.EXAMPLES.find((x) => x.id === "spiral"), mode: "exact" }
);

const manifest = [];
for (const job of jobs) {
  const id = job.example.id + (job.mode === "exact" ? "_exact" : "_elastic");
  const out = path.join(outRoot, id);
  fs.mkdirSync(out, { recursive: true });
  const source = job.example.make();
  source.name = id;
  const result = F.processMesh(source, {
    mode: job.mode,
    targetSize: 150,
    panelLimit: panelLimits[job.example.id] || 100,
    gap: 1.0,
    thickness: 0.8,
    pauseHeight: 0.4,
    bedSize: 256,
    fabricMargin: 30,
    trials: job.mode === "exact" ? 72 : 24,
    seed: 1337
  });
  result.name = id;
  const files = {
    print: `${id}_PRINT_0p8mm.stl`,
    target: `${id}_TARGET_SIMPLIFIED.stl`,
    svg: `${id}_ASSEMBLY.svg`,
    fold: `${id}.fold`,
    assembly: `${id}_ASSEMBLY.json`
  };
  fs.writeFileSync(path.join(out, files.print), result.exports.printSTL());
  fs.writeFileSync(path.join(out, files.target), result.exports.targetSTL());
  fs.writeFileSync(path.join(out, files.svg), result.exports.svg());
  fs.writeFileSync(path.join(out, files.fold), result.exports.fold());
  fs.writeFileSync(path.join(out, files.assembly), result.exports.assembly());
  const record = {
    id,
    title: job.example.name,
    note: job.example.note,
    mode: job.mode,
    files,
    input_faces: source.faces.length,
    output_panels: result.print.panels.length,
    islands: result.packed.islands.length,
    closing_seams: result.assembly.seams.length,
    actual_folded_longest_mm: +result.assembly.summary.foldedLongestDimension.toFixed(3),
    plate_used_mm: result.packed.used.map((x) => +x.toFixed(3)),
    mesh_audit: {
      triangles: result.audit.triangles,
      degenerate_triangles: result.audit.degenerateTriangles,
      open_or_nonmanifold_edges: result.audit.openOrNonmanifoldEdges,
      watertight_panels: result.audit.watertightPanels
    },
    warnings: result.warnings
  };
  manifest.push(record);
  console.log(`${id.padEnd(24)} panels=${String(record.output_panels).padStart(3)} islands=${String(record.islands).padStart(2)} seams=${String(record.closing_seams).padStart(3)} size=${record.actual_folded_longest_mm.toFixed(1)} audit=${record.mesh_audit.watertight_panels ? "PASS" : "FAIL"}`);
}

fs.writeFileSync(path.join(outRoot, "examples_manifest.json"), JSON.stringify(manifest, null, 2));
const rows = manifest.map((x, i) => `| ${i + 1} | ${x.title} | ${x.mode} | ${x.output_panels} | ${x.islands} | ${x.closing_seams} | ${x.actual_folded_longest_mm.toFixed(1)} | ${x.mesh_audit.watertight_panels ? "PASS" : "FAIL"} |`).join("\n");
fs.writeFileSync(path.join(outRoot, "EXAMPLES_JA.md"), `# FoldForge 作例集\n\n| # | 作例 | 方式 | パネル | 島 | 閉じ縁 | 実完成最長辺 mm | STL監査 |\n|---:|---|---|---:|---:|---:|---:|---|\n${rows}\n\n- elastic: 15Dチュールの伸びを使う一枚スキン方式。猫・マスク・レリーフ向け。\n- exact: 面寸法を保つ多面体ネット。紫の同じS番号を磁石・糸・テープで閉じる。\n- すべて外周印刷枠なし、板厚0.8 mm、停止高さ0.4 mm。\n`);

if (manifest.some((x) => !x.mesh_audit.watertight_panels)) process.exitCode = 1;

