import argparse
import json
from pathlib import Path

import numpy as np


def pack_f16_rgba(arr_3ch: np.ndarray) -> bytes:
    """Pack a (G,G,G,3) float array as RGBA float16 bytes."""
    if arr_3ch.shape[-1] != 3:
        raise ValueError(f"expected 3 channels, got {arr_3ch.shape}")
    out = np.zeros(arr_3ch.shape[:-1] + (4,), dtype=np.float16)
    out[..., :3] = arr_3ch.astype(np.float16)
    return out.tobytes()


def read_points_ply(path: Path) -> np.ndarray:
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        nverts = 0
        while True:
            line = handle.readline()
            if not line:
                raise ValueError(f"{path} is missing a PLY end_header")
            stripped = line.strip()
            if stripped.startswith("element vertex"):
                nverts = int(stripped.split()[-1])
            if stripped == "end_header":
                break

        pts = np.empty((nverts, 3), dtype=np.float32)
        for idx in range(nverts):
            parts = handle.readline().strip().split()
            pts[idx] = (float(parts[0]), float(parts[1]), float(parts[2]))
    return pts


def vector_stats(*fields: np.ndarray) -> dict:
    speeds = np.concatenate([np.linalg.norm(field.reshape(-1, 3), axis=1) for field in fields])
    return {
        "speedP50": float(np.percentile(speeds, 50)),
        "speedP90": float(np.percentile(speeds, 90)),
        "speedP98": float(np.percentile(speeds, 98)),
        "speedMax": float(np.max(speeds)),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--src",
        default="C:/Users/assas/PycharmProjects/mindVisualizer/data/roi_flow",
        help="mindVisualizer data/roi_flow directory",
    )
    parser.add_argument(
        "--structures",
        default="C:/Users/assas/PycharmProjects/mindVisualizer/data/structures.json",
        help="optional structures.json to mirror into public/data/mindvis",
    )
    parser.add_argument(
        "--out",
        default="public/data/mindvis/field/grid64",
        help="output directory for web field binaries",
    )
    parser.add_argument("--seed", type=int, default=17)
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    meta_in = json.loads((src / "mdn_universal_raw_grid64_meta.json").read_text(encoding="utf-8"))
    grid = int(meta_in["grid"])
    amin = np.asarray(meta_in["axis_min"], dtype=np.float32)
    amax = np.asarray(meta_in["axis_max"], dtype=np.float32)
    files = meta_in["files"]

    def load(name: str, channels: int) -> np.ndarray:
        raw = np.fromfile(src / name, dtype=np.float32)
        return raw.reshape(grid, grid, grid, channels)

    mean = load(files["mean_xyz3"], 3)
    mu1 = load(files["mu1_xyz3"], 3)
    mu2 = load(files["mu2_xyz3"], 3)

    pi_raw = np.fromfile(src / files["pi"], dtype=np.float32)
    base = grid * grid * grid
    if pi_raw.size == base:
        pi = np.stack([pi_raw.reshape(grid, grid, grid), 1.0 - pi_raw.reshape(grid, grid, grid)], axis=-1)
    elif pi_raw.size % base == 0:
        pi = pi_raw.reshape(grid, grid, grid, pi_raw.size // base)
    else:
        raise ValueError(f"pi size {pi_raw.size} is not compatible with grid {grid}")

    entropy = np.fromfile(src / files["entropy"], dtype=np.float32).reshape(grid, grid, grid)
    gated = np.where(pi.argmax(axis=-1)[..., None] == 0, mu1, mu2)

    (out / "field_mean.f16.bin").write_bytes(pack_f16_rgba(mean))
    (out / "field_mu1.f16.bin").write_bytes(pack_f16_rgba(mu1))
    (out / "field_mu2.f16.bin").write_bytes(pack_f16_rgba(mu2))
    (out / "field_gated.f16.bin").write_bytes(pack_f16_rgba(gated))

    pi_padded = np.zeros((grid, grid, grid, 4), dtype=np.float16)
    pi_padded[..., : min(pi.shape[-1], 4)] = pi[..., : min(pi.shape[-1], 4)].astype(np.float16)
    (out / "field_pi.f16.bin").write_bytes(pi_padded.tobytes())

    entropy_max = float(np.max(entropy))
    entropy_norm = (entropy / max(entropy_max, 1e-9)).astype(np.float16)
    (out / "field_entropy.f16.bin").write_bytes(entropy_norm.tobytes())

    points_path = src / "universal_soul_2sdm_rest_points.ply"
    if points_path.exists():
        points = read_points_ply(points_path)
    else:
        points = np.load(src / meta_in["training_points_npy"]).astype(np.float32)

    rng = np.random.default_rng(args.seed)
    if len(points) > 50000:
        points = points[rng.choice(len(points), size=50000, replace=False)]
    (out / "oos_points.f16.bin").write_bytes(points.astype(np.float16).tobytes())

    stats = vector_stats(mean, mu1, mu2, gated)
    meta_out = {
        "schemaVersion": 1,
        "grid": grid,
        "k": int(pi.shape[-1]),
        "axisMin": amin.tolist(),
        "axisMax": amax.tolist(),
        "span": (amax - amin).tolist(),
        "entropyMax": entropy_max,
        "oosCount": int(len(points)),
        "components": ["mean", "gated", "mu1", "mu2"],
        **stats,
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
