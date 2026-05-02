import argparse
import json
from pathlib import Path

import numpy as np
import vtk


def transform_polydata(poly: vtk.vtkPolyData, alignment: np.ndarray) -> vtk.vtkPolyData:
    scale = vtk.vtkTransform()
    scale.Scale(0.001, 0.001, 0.001)
    sf = vtk.vtkTransformPolyDataFilter()
    sf.SetInputData(poly)
    sf.SetTransform(scale)
    sf.Update()

    mx = vtk.vtkMatrix4x4()
    for i in range(4):
        for j in range(4):
            mx.SetElement(i, j, float(alignment[i, j]))
    tf = vtk.vtkTransform()
    tf.SetMatrix(mx)
    af = vtk.vtkTransformPolyDataFilter()
    af.SetInputData(sf.GetOutput())
    af.SetTransform(tf)
    af.Update()
    return af.GetOutput()


def simplify(poly: vtk.vtkPolyData, target_reduction: float) -> vtk.vtkPolyData:
    tri = vtk.vtkTriangleFilter()
    tri.SetInputData(poly)
    tri.Update()
    clean = vtk.vtkCleanPolyData()
    clean.SetInputData(tri.GetOutput())
    clean.Update()
    src = clean.GetOutput()
    if src.GetNumberOfPolys() < 80 or target_reduction <= 0:
        return src
    dec = vtk.vtkQuadricDecimation()
    dec.SetInputData(src)
    dec.SetTargetReduction(float(target_reduction))
    dec.Update()
    return dec.GetOutput()


def poly_to_arrays(poly: vtk.vtkPolyData, axis_min: np.ndarray, span: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    points = poly.GetPoints()
    if points is None:
        raise ValueError("polydata has no points")
    verts = np.array([points.GetPoint(i) for i in range(points.GetNumberOfPoints())], dtype=np.float32)
    verts = ((verts - axis_min) / span).astype(np.float32)

    polys = poly.GetPolys()
    polys.InitTraversal()
    ids = vtk.vtkIdList()
    indices: list[int] = []
    while polys.GetNextCell(ids):
        if ids.GetNumberOfIds() < 3:
            continue
        root = int(ids.GetId(0))
        for i in range(1, ids.GetNumberOfIds() - 1):
            indices.extend([root, int(ids.GetId(i)), int(ids.GetId(i + 1))])
    return verts, np.asarray(indices, dtype=np.uint32)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export MindVisualizer region OBJ meshes for lazy WebGL highlights.")
    parser.add_argument("--src", type=Path, default=Path("C:/Users/assas/PycharmProjects/mindVisualizer/data/meshes_obj"))
    parser.add_argument("--alignment", type=Path, default=Path("C:/Users/assas/PycharmProjects/mindVisualizer/data/brain_alignment.json"))
    parser.add_argument("--label-meta", type=Path, default=Path("public/data/mindvis/label_grid/meta.json"))
    parser.add_argument("--field-meta", type=Path, default=Path("public/data/mindvis/field/grid125/meta.json"))
    parser.add_argument("--out", type=Path, default=Path("public/data/mindvis/region_meshes"))
    parser.add_argument("--target-reduction", type=float, default=0.82)
    args = parser.parse_args()

    label_meta = json.loads(args.label_meta.read_text(encoding="utf-8"))
    keys = [k for k in label_meta["keys"] if k]
    field_meta = json.loads(args.field_meta.read_text(encoding="utf-8"))
    axis_min = np.asarray(field_meta["axisMin"], dtype=np.float32)
    span = np.asarray(field_meta["span"], dtype=np.float32)
    alignment = np.asarray(json.loads(args.alignment.read_text(encoding="utf-8"))["matrix"], dtype=np.float32)

    args.out.mkdir(parents=True, exist_ok=True)
    meshes = {}
    for key in keys:
        obj = args.src / f"{key}.obj"
        if not obj.exists():
            continue
        reader = vtk.vtkOBJReader()
        reader.SetFileName(str(obj))
        reader.Update()
        poly = transform_polydata(reader.GetOutput(), alignment)
        poly = simplify(poly, args.target_reduction)
        positions, indices = poly_to_arrays(poly, axis_min, span)
        if len(positions) == 0 or len(indices) == 0:
            continue
        pos_name = f"{key}.positions.f32.bin"
        idx_name = f"{key}.indices.u32.bin"
        (args.out / pos_name).write_bytes(positions.tobytes())
        (args.out / idx_name).write_bytes(indices.tobytes())
        meshes[key] = {
            "positions": pos_name,
            "indices": idx_name,
            "vertexCount": int(len(positions)),
            "indexCount": int(len(indices)),
        }
        print(f"{key}: {len(positions)} vertices, {len(indices) // 3} tris")

    (args.out / "manifest.json").write_text(json.dumps({"schemaVersion": 1, "meshes": meshes}, indent=2), encoding="utf-8")
    print(f"wrote {len(meshes)} region meshes to {args.out}")


if __name__ == "__main__":
    main()
