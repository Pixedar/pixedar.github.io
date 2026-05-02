import argparse
import json
from pathlib import Path

import numpy as np


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the MindVisualizer Python label grid cache for WebGL.")
    parser.add_argument(
        "--cache",
        type=Path,
        default=Path("C:/Users/assas/PycharmProjects/mindVisualizer/data/label_grid_cache.npz"),
    )
    parser.add_argument(
        "--keys",
        type=Path,
        default=Path("C:/Users/assas/PycharmProjects/mindVisualizer/data/label_grid_cache.keys.json"),
    )
    parser.add_argument("--out", type=Path, default=Path("public/data/mindvis/label_grid"))
    args = parser.parse_args()

    data = np.load(args.cache)
    grid = data["grid"].astype(np.int16, copy=False)
    origin = data["origin"].astype(np.float32)
    grid_max = data["grid_max"].astype(np.float32)
    spacing = data["spacing"].astype(np.float32)
    keys = json.loads(args.keys.read_text(encoding="utf-8"))

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "grid.i16.bin").write_bytes(grid.tobytes(order="C"))
    (args.out / "meta.json").write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "grid": int(grid.shape[0]),
                "shape": [int(v) for v in grid.shape],
                "origin": origin.tolist(),
                "gridMax": grid_max.tolist(),
                "spacing": spacing.tolist(),
                "keys": keys,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
