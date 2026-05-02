import argparse
import json
from pathlib import Path

import numpy as np


def pack_f16_rgba(arr_3ch: np.ndarray) -> bytes:
    if arr_3ch.shape[-1] != 3:
        raise ValueError(f"expected 3 channels, got {arr_3ch.shape}")
    out = np.zeros(arr_3ch.shape[:-1] + (4,), dtype=np.float16)
    out[..., :3] = arr_3ch.astype(np.float16)
    return out.tobytes()


def vector_stats(*fields: np.ndarray) -> dict:
    speeds = np.concatenate([np.linalg.norm(field.reshape(-1, 3), axis=1) for field in fields])
    return {
        "speedP50": float(np.percentile(speeds, 50)),
        "speedP90": float(np.percentile(speeds, 90)),
        "speedP98": float(np.percentile(speeds, 98)),
        "speedMax": float(np.max(speeds)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the full-brain grid125 MDN field for WebGL.")
    parser.add_argument(
        "--src",
        default="C:/Users/assas/PycharmProjects/mindVisualizer/data/mdn",
        help="mindVisualizer data/mdn directory",
    )
    parser.add_argument(
        "--structures",
        default="C:/Users/assas/PycharmProjects/mindVisualizer/data/structures.json",
        help="optional structures.json to mirror into public/data/mindvis",
    )
    parser.add_argument(
        "--out",
        default="public/data/mindvis/field/grid125",
        help="output directory for web field binaries",
    )
    parser.add_argument("--seed", type=int, default=23)
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    meta_in = json.loads((src / "mdn_particles_rdcim_teacher_edge_hq_grid125_meta.json").read_text(encoding="utf-8"))
    grid = int(meta_in["grid"])
    amin = np.asarray(meta_in["axis_min"], dtype=np.float32)
    amax = np.asarray(meta_in["axis_max"], dtype=np.float32)
    files = meta_in["files"]

    def load(name: str, channels: int) -> np.ndarray:
        raw = np.fromfile(src / name, dtype=np.float32)
        return raw.reshape(grid, grid, grid, channels)

    mean = load(files["mean_xyz3"], 3)
    mus: list[np.ndarray] = []
    for idx in range(1, 7):
        key = f"mu{idx}_xyz3"
        if key in files:
            mus.append(load(files[key], 3))

    pi_raw = np.fromfile(src / files["pi"], dtype=np.float32)
    base = grid * grid * grid
    if pi_raw.size % base != 0:
      raise ValueError(f"pi size {pi_raw.size} is not compatible with grid {grid}")
    pi = pi_raw.reshape(grid, grid, grid, pi_raw.size // base)

    entropy = np.fromfile(src / files["entropy"], dtype=np.float32).reshape(grid, grid, grid)
    winner = pi.argmax(axis=-1)
    gated = np.zeros_like(mean, dtype=np.float32)
    for idx, mu in enumerate(mus):
        gated += mu * (winner[..., None] == idx).astype(np.float32)

    fields = {"mean": mean, "gated": gated}
    fields.update({f"mu{idx + 1}": mu for idx, mu in enumerate(mus)})
    for name, field in fields.items():
        (out / f"field_{name}.f16.bin").write_bytes(pack_f16_rgba(field))

    entropy_max = float(np.max(entropy))
    (out / "field_entropy.f16.bin").write_bytes((entropy / max(entropy_max, 1e-9)).astype(np.float16).tobytes())

    train = np.load(src / meta_in["training_points_npy"]).astype(np.float32)
    rng = np.random.default_rng(args.seed)
    if len(train) > 50000:
        train = train[rng.choice(len(train), size=50000, replace=False)]
    (out / "oos_points.f16.bin").write_bytes(train.astype(np.float16).tobytes())

    meta_out = {
        "schemaVersion": 1,
        "grid": grid,
        "k": int(pi.shape[-1]),
        "axisMin": amin.tolist(),
        "axisMax": amax.tolist(),
        "span": (amax - amin).tolist(),
        "entropyMax": entropy_max,
        "oosCount": int(len(train)),
        "components": list(fields.keys()),
        **vector_stats(*fields.values()),
    }
    (out / "meta.json").write_text(json.dumps(meta_out, indent=2), encoding="utf-8")

    structures_path = Path(args.structures)
    if structures_path.exists():
        mindvis_out = out.parents[1]
        (mindvis_out / "structures.json").write_text(structures_path.read_text(encoding="utf-8"), encoding="utf-8")

    explanations = out.parents[1] / "explanations.json"
    if not explanations.exists():
        explanations.write_text(json.dumps({"schemaVersion": 1, "items": {}}, indent=2), encoding="utf-8")

    print(f"wrote web assets to {out}")


if __name__ == "__main__":
    main()
