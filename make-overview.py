#!/usr/bin/env python3
"""Render a compact target-vs-print overview for the built-in examples."""

from __future__ import annotations

import json
import math
from pathlib import Path
import struct

import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import numpy as np


BASE = Path(__file__).resolve().parent
EXAMPLES = BASE / "examples"


def read_binary_stl(path: Path):
    data = path.read_bytes()
    count = struct.unpack_from("<I", data, 80)[0]
    triangles = []
    offset = 84
    for _ in range(count):
        values = struct.unpack_from("<12f", data, offset)
        triangles.append(np.array(values[3:], float).reshape(3, 3))
        offset += 50
    return np.array(triangles)


manifest = json.loads((EXAMPLES / "examples_manifest.json").read_text(encoding="utf-8"))
items = [x for x in manifest if x["mode"] == "elastic"]
rows = math.ceil(len(items) / 2)
fig = plt.figure(figsize=(14, rows * 3.15), dpi=150, facecolor="#f4f2ed")

for index, item in enumerate(items):
    row, pair = divmod(index, 2)
    col = pair * 2
    folder = EXAMPLES / item["id"]
    target = read_binary_stl(folder / item["files"]["target"])
    printed = read_binary_stl(folder / item["files"]["print"])

    ax3 = fig.add_subplot(rows, 4, row * 4 + col + 1, projection="3d")
    collection = Poly3DCollection(target, facecolor="#d94132", edgecolor="#59251f", linewidth=0.22, alpha=0.87)
    ax3.add_collection3d(collection)
    pts = target.reshape(-1, 3)
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    centre, span = 0.5 * (lo + hi), max(hi - lo)
    for setter, c in zip((ax3.set_xlim, ax3.set_ylim, ax3.set_zlim), centre):
        setter(c - span * 0.55, c + span * 0.55)
    ax3.view_init(elev=25, azim=-55)
    ax3.set_axis_off()
    label = item["id"].replace("_elastic", "").replace("_", " ").title()
    ax3.set_title(f"{index + 1:02d} {label}\n3D target", fontsize=9, pad=0)

    ax2 = fig.add_subplot(rows, 4, row * 4 + col + 2)
    top = printed[np.all(np.isclose(printed[:, :, 2], 0.8, atol=1e-4), axis=1), :, :2]
    ax2.add_collection(PolyCollection(top, facecolor="#e14a3d", edgecolor="#6f312c", linewidth=0.18, alpha=0.85))
    if len(top):
        xy = top.reshape(-1, 2)
        lo2, hi2 = xy.min(axis=0), xy.max(axis=0)
        centre2, span2 = 0.5 * (lo2 + hi2), max(hi2 - lo2)
        ax2.set_xlim(centre2[0] - span2 * 0.56, centre2[0] + span2 * 0.56)
        ax2.set_ylim(centre2[1] - span2 * 0.56, centre2[1] + span2 * 0.56)
    ax2.set_aspect("equal")
    ax2.set_axis_off()
    ax2.set_title(f"print layout — {item['output_panels']} panels", fontsize=9, pad=0)

fig.suptitle("FoldForge Studio — 14 built-in elastic-morph examples", fontsize=15, y=0.998)
fig.tight_layout(pad=1.0, h_pad=1.5, w_pad=0.3)
output = BASE / "examples_overview.png"
fig.savefig(output, bbox_inches="tight", facecolor=fig.get_facecolor())
print(output)
