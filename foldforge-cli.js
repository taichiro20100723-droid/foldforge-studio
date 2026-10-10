#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const F = require("./foldforge-core.js");

function usage() {
  console.log(`FoldForge Studio ${F.VERSION}

Usage:
  node foldforge-cli.js input.stl output-directory [options]

Options:
  --mode elastic|exact   Conversion engine (default: elastic)
  --size MM              Target longest dimension (default: 150)
  --panels N             Approximate panel limit (default: 120)
  --gap MM               Top hinge gap (default: 1.0)
  --thickness MM         Printed thickness (default: 0.8)
  --pause MM             Fabric insertion height (default: 0.4)
  --bed MM               Square bed size (default: 256)
  --margin MM            Fabric fixation margin (default: 30)
  --projection auto|xy|xz|yz
  --front auto|true|false
  --trials N             Exact-net search trials (default: 48)
`);
}

const argv = process.argv.slice(2);
if (argv.length < 2 || argv.includes("--help") || argv.includes("-h")) { usage(); process.exit(argv.length < 2 ? 1 : 0); }
const input = path.resolve(argv[0]);
const output = path.resolve(argv[1]);
const options = { ...F.DEFAULTS };
const mapping = {
  "--mode": ["mode", String], "--size": ["targetSize", Number], "--panels": ["panelLimit", Number],
  "--gap": ["gap", Number], "--thickness": ["thickness", Number], "--pause": ["pauseHeight", Number],
  "--bed": ["bedSize", Number], "--margin": ["fabricMargin", Number], "--projection": ["projection", String],
  "--trials": ["trials", Number]
};
for (let i = 2; i < argv.length; i++) {
  const flag = argv[i];
  if (flag === "--front") {
    const value = argv[++i]; options.frontOnly = value === "auto" ? "auto" : value === "true"; continue;
  }
  if (!mapping[flag] || i + 1 >= argv.length) throw new Error("Unknown or incomplete option: " + flag);
  const [key, cast] = mapping[flag]; options[key] = cast(argv[++i]);
}

const bytes = fs.readFileSync(input);
const mesh = F.parseSTL(bytes);
const base = path.basename(input).replace(/\.stl$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "_") || "model";
mesh.name = base;
const result = F.processMesh(mesh, options); result.name = base;
fs.mkdirSync(output, { recursive: true });
const files = {
  print: path.join(output, base + "_PRINT_0p8mm.stl"),
  target: path.join(output, base + "_TARGET_SIMPLIFIED.stl"),
  svg: path.join(output, base + "_ASSEMBLY.svg"),
  fold: path.join(output, base + ".fold"),
  assembly: path.join(output, base + "_ASSEMBLY.json")
};
fs.writeFileSync(files.print, result.exports.printSTL());
fs.writeFileSync(files.target, result.exports.targetSTL());
fs.writeFileSync(files.svg, result.exports.svg());
fs.writeFileSync(files.fold, result.exports.fold());
fs.writeFileSync(files.assembly, result.exports.assembly());
console.log(JSON.stringify({
  status: "PASS",
  version: F.VERSION,
  input,
  output,
  files,
  summary: result.assembly.summary,
  audit: result.audit,
  warnings: result.warnings
}, null, 2));

