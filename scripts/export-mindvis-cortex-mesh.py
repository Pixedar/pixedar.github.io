import argparse
import json
from pathlib import Path

import numpy as np


DEFAULT_OBJ = Path("C:/Users/assas/PycharmProjects/mindVisualizer/data/meshes_obj/10159.obj")
DEFAULT_ALIGN = Path("C:/Users/assas/PycharmProjects/mindVisualizer/data/brain_alignment.json")
DEFAULT_FIELD_META = Path("public/data/mindvis/field/grid64/meta.json")
DEFAULT_OUT = Path("public/data/mindvis/meshes")


def parse_obj(path: Path) -> tuple[np.ndarray, np.ndarray]:
    vertices: list[list[float]] = []
    indices: list[int] = []

    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("v "):
            _, x, y, z, *_ = line.split()
            vertices.append([float(x), float(y), float(z)])
        elif line.startswith("f "):
            face = []
            for token in line.split()[1:]:
                face.append(int(token.split("/")[0]) - 1)
            for i in range(1, len(face) - 1):
                indices.extend([face[0], face[i], face[i + 1]])

    if not vertices or not indices:
        raise ValueError(f"{path} did not contain vertices and faces")

    return np.asarray(vertices, dtype=np.float32), np.asarray(indices, dtype=np.uint32)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the default MindVisualizer cortex mesh for WebGL.")
    parser.add_argument("--obj", type=Path, default=DEFAULT_OBJ)
    parser.add_argument("--alignment", type=Path, default=DEFAULT_ALIGN)
    parser.add_argument("--field-meta", type=Path, default=DEFAULT_FIELD_META)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    vertices, indices = parse_obj(args.obj)
    alignment = np.asarray(json.loads(args.alignment.read_text(encoding="utf-8"))["matrix"], dtype=np.float32)
    meta = json.loads(args.field_meta.read_text(encoding="utf-8"))
    axis_min = np.asarray(meta["axisMin"], dtype=np.float32)
    span = np.asarray(meta["span"], dtype=np.float32)

    vertices_mm = vertices * 0.001
    hom = np.concatenate([vertices_mm, np.ones((len(vertices_mm), 1), dtype=np.float32)], axis=1)
    world = (hom @ alignment.T)[:, :3].astype(np.float32)
    normalized = ((world - axis_min) / span).astype(np.float32)

    args.out.mkdir(parents=True, exist_ok=True)
    pos_path = args.out / "cortex_positions.f32.bin"
    idx_path = args.out / "cortex_indices.u32.bin"
    manifest_path = args.out / "manifest.json"

    pos_path.write_bytes(normalized.tobytes())
    idx_path.write_bytes(indices.tobytes())
    manifest_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "defaultMesh": "cortex",
                "meshes": {
                    "cortex": {
                        "name": "cerebral cortex (Cx)",
                        "positions": pos_path.name,
                        "indices": idx_path.name,
                        "vertexCount": int(len(normalized)),
                        "indexCount": int(len(indices)),
                        "sourceRegion": "10159",
                    }
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"wrote {manifest_path}")


if __name__ == "__main__":
    main()
