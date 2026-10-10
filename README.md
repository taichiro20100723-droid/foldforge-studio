# FoldForge Studio

Turn a 3D model (STL) into a flat sheet of rigid PLA panels joined by a single sheet of 15D tulle.
Print the panels flat, pause at Z = 0.40 mm to lay the tulle, resume, then press the sheet into shape by hand.

STLを入れると、3Dプリントで一枚のシートにして、手で押して立体に変形させられるパネル群（0.8 mm PLA + 15Dチュール）に変換するツールです。

- **Open `FoldForge_Studio_Standalone.html` in a browser** — no install, no server.
- 日本語の詳しい説明: [README_JA.md](README_JA.md)
- 変更履歴: [CHANGELOG.md](CHANGELOG.md) / 検証結果: [VALIDATION_REPORT.md](VALIDATION_REPORT.md)

## What it does

| Mode | Use it for |
|---|---|
| Elastic morph | Domes, masks, shells. Panels keep their true 3D size and the stretchy tulle absorbs the rest. |
| Exact net | Shapes that must keep face sizes. Unfolds the mesh into islands with seams. |

Every panel is a 4-layer flush-clamp hinge (L2 and L3 share one outline so the tulle is always clamped from both sides),
with mountain/valley baked into L1/L4, vertex relief chamfers and antiphase serrations so a peel crack cannot run along a crease.
The generator guarantees at least 0.8 mm between any two panels (checked on the real plastic outlines).

## Command line

```bash
node foldforge-cli.js input.stl out/ --mode elastic --size 150 --panels 100
node generate-examples.js     # rebuild the 16 built-in examples
node tests/test-foldforge.js  # invariants: closed manifold, 0.800 mm thick, clearance, bed bounds
node build.js                 # rebuild the standalone HTML
```

Requires Node.js 18+. `tests/audit_stl_independent.py` re-measures the generated STLs with code that shares nothing with the generator.

## Print

0.20 mm layers, 100 % infill, no supports. Pause at Z = 0.40 mm, lay taut 15D tulle (keep ~30 mm of margin on the bed edge for magnets),
resume with the first layer at 15–20 mm/s.

## License

MIT — see [LICENSE.txt](LICENSE.txt).
