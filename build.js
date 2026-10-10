"use strict";

const fs = require("fs");
const path = require("path");

const here = __dirname;
const core = fs.readFileSync(path.join(here, "foldforge-core.js"), "utf8");
const template = fs.readFileSync(path.join(here, "ui-fragment.template.html"), "utf8");
if (!template.includes("/*__FOLDFORGE_CORE__*/")) throw new Error("core placeholder missing");
const fragment = template.replace("/*__FOLDFORGE_CORE__*/", core);

const fragmentPath = path.join(here, "foldforge-studio-inline-fragment.html");
fs.writeFileSync(fragmentPath, fragment);

const hostStyles = `
:root{color-scheme:light dark;--background:#f6f5f2;--foreground:#1b1b1b;--card:#fff;--card-foreground:#1b1b1b;--muted:#e9e7e2;--muted-foreground:#666;--primary:#222;--primary-foreground:#fff;--secondary:#ece9e3;--secondary-foreground:#222;--accent:#e7e2d9;--accent-foreground:#111;--border:#9c9a94;--input:#aaa;--ring:#444;--viz-series-1:#df3f32;--viz-series-2:#e14336;--viz-series-3:#356cd3;--viz-series-4:#8a2be2;--viz-series-5:#258b5b;--viz-series-6:#cc8b12;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--font-size-base:15px}
@media(prefers-color-scheme:dark){:root{--background:#171717;--foreground:#eceae5;--card:#232323;--card-foreground:#eee;--muted:#2b2b2b;--muted-foreground:#aaa;--primary:#eee;--primary-foreground:#181818;--secondary:#303030;--secondary-foreground:#eee;--accent:#383838;--accent-foreground:#fff;--border:#626262;--input:#777;--ring:#ddd;--viz-series-1:#ff6354;--viz-series-2:#ff6858;--viz-series-3:#6e9cff;--viz-series-4:#b67cff;--viz-series-5:#5ec58d;--viz-series-6:#f0b84e}}
*{box-sizing:border-box}body{margin:0;padding:20px;background:var(--background);color:var(--foreground);font-size:var(--font-size-base)}.viz-controls,.viz-row{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center}.viz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin-top:1rem}.card{background:var(--card);color:var(--card-foreground);border:1px solid var(--border);border-radius:10px;padding:.8rem}.viz-stat{display:flex;flex-direction:column;gap:.25rem}.viz-stat-value{font-size:1.28rem;font-weight:500}.text-muted{color:var(--muted-foreground)}.text-small{font-size:.82rem}.form-label{display:flex;flex-direction:column;gap:.3rem}.form-control,.form-select{width:100%;padding:.48rem .55rem;border:1px solid var(--input);border-radius:7px;background:var(--background);color:var(--foreground)}.form-range{width:100%}.btn{appearance:none;border:1px solid var(--border);border-radius:8px;padding:.52rem .72rem;background:var(--secondary);color:var(--secondary-foreground);cursor:pointer}.btn-primary{background:var(--primary);color:var(--primary-foreground);border-color:var(--primary)}.btn-ghost{background:transparent}.btn:disabled{opacity:.45;cursor:not-allowed}summary{padding:.45rem 0}output{font-variant-numeric:tabular-nums}
`;
const standalone = `<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FoldForge Studio — STL to Tulle Origami</title><style>${hostStyles}</style></head><body>${fragment}</body></html>\n`;
fs.writeFileSync(path.join(here, "FoldForge_Studio_Standalone.html"), standalone);

console.log(JSON.stringify({ fragmentPath, fragmentBytes: Buffer.byteLength(fragment), standaloneBytes: Buffer.byteLength(standalone) }));
