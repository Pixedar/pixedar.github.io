#!/usr/bin/env python3
"""HF-safe live MindVisualizer wrapper.

This is a web transport for the Python/VTK runtime. It imports the original
project modules for field loading, particle helpers, mesh overlay, probes, and
GPT analysis instead of reimplementing the algorithms in TypeScript.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
import threading
from pathlib import Path

import numpy as np
import vtk
from scipy.spatial import cKDTree
from vtkmodules.util.numpy_support import numpy_to_vtk
from vtkmodules.vtkInteractionStyle import vtkInteractorStyleTrackballCamera

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
MDN_DIR = DATA_DIR / "mdn"
MESH_DIR = DATA_DIR / "meshes"
ALIGNMENT_FILE = DATA_DIR / "brain_alignment.json"
DEFAULT_META = MDN_DIR / "mdn_particles_rdcim_teacher_edge_hq_grid125_meta.json"
DEFAULT_OOS = MDN_DIR / "mdn_particles_rdcim_teacher_edge_hq_training_points.npy"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.colormaps import bicolor_white_center, rainbow_rgb01, turbo_rgb01
from src.field_loader import TriLinearSampler, load_field, load_points_any
from src.main import (
    VtkTextOverlay,
    add_window_legend,
    build_cloud,
    compute_fraction_mask,
    densify_oos_surface,
    lattice_positions,
    wrap_inside,
)
from src.mesh_overlay import FlowMeshOverlay
from src.probe import ProbeSystem
from src.region_analyzer import analyze_probe_path, analyze_with_gpt


def ensure_ssl() -> None:
    try:
        import certifi

        cert_file = certifi.where()
        for name in ("SSL_CERT_FILE", "REQUESTS_CA_BUNDLE"):
            current = os.environ.get(name, "")
            if not current or not os.path.isfile(current):
                os.environ[name] = cert_file
    except Exception:
        pass


class LiveMindVisualizer:
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.rng = np.random.default_rng(2025)
        self.paused = False
        self.field_mode = "mean"
        self.colour_mode = "SPEED"
        self.cmap_mode = "TURBO"
        self.filter_mode = "OFF"
        self.filter_top = True
        self.filter_frac = 1.0
        self.clip_on = False
        self.clip_frac = 1.0
        self.mdn_alpha = 1.0
        self.oos_visible = False
        self.probe_busy = False
        self.gpt_pending: str | None = None
        self._load_data()
        self._setup_vtk()

    def _load_data(self) -> None:
        self.field = load_field(self.args.meta)
        self.G = self.field["G"]
        self.amin = self.field["amin"]
        self.amax = self.field["amax"]
        self.V_mean = self.field["mean"]
        self.MUS = self.field["mus"]
        self.PI = self.field["pi"]
        self.ENT = self.field["ENT"]
        self.K = len(self.MUS)

        self.sampler_mean = TriLinearSampler(self.V_mean, self.amin, self.amax)
        self.diag = float(np.linalg.norm(self.amax - self.amin))
        self.target_step = self.args.max_step_frac * max(self.diag, 1e-6)
        self.vmax_mean = self._interior_percentile(self.V_mean)

        self.samplers_comp = [TriLinearSampler(mu, self.amin, self.amax) for mu in self.MUS]
        self.sampler_gated = None
        self.V_gated = None
        if self.PI is not None and self.PI.ndim == 4 and self.PI.shape[-1] == self.K and self.K > 0:
            idx = np.argmax(self.PI, axis=-1)
            self.V_gated = np.zeros_like(self.MUS[0], dtype=np.float32)
            for k_i in range(self.K):
                self.V_gated += self.MUS[k_i] * (idx == k_i)[..., None].astype(np.float32)
            self.sampler_gated = TriLinearSampler(self.V_gated, self.amin, self.amax)

        self.field_modes = ["mean"]
        if self.sampler_gated is not None:
            self.field_modes.append("gated")
        self.field_modes += [f"comp{i + 1}" for i in range(self.K)]

        self.sampler_by_name = {"mean": self.sampler_mean}
        if self.sampler_gated is not None:
            self.sampler_by_name["gated"] = self.sampler_gated
        for i, sampler in enumerate(self.samplers_comp):
            self.sampler_by_name[f"comp{i + 1}"] = sampler

        self.vmax_by_name = {"mean": self.vmax_mean}
        if self.V_gated is not None:
            self.vmax_by_name["gated"] = self._interior_percentile(self.V_gated)
        for i, mu in enumerate(self.MUS):
            self.vmax_by_name[f"comp{i + 1}"] = self._interior_percentile(mu)

        self.ent_min = self.ent_max = 0.0
        if self.ENT is not None:
            self.ent_min = float(np.min(self.ENT))
            self.ent_max = float(np.max(self.ENT))

        self.oos_pts = None
        if self.args.oos is not None and Path(self.args.oos).exists():
            self.oos_pts = load_points_any(Path(self.args.oos)).astype(np.float32)

        self._seed_particles()
        self._prepare_oos_distance()

    def _interior_percentile(self, vec: np.ndarray, q: float = 100.0) -> float:
        mag = np.linalg.norm(vec.reshape(-1, 3), axis=1)
        nz = mag[mag > 0]
        return float(np.percentile(nz, q)) if nz.size else 1.0

    def _seed_particles(self) -> None:
        overlap_radius = float(self.args.overlap_frac) * max(self.diag, 1e-9)
        overlap_sigma = float(self.args.overlap_jitter) * max(self.diag, 1e-9)
        self.seed_mode = "grid"
        self.seed_points = None
        self.n_axis = None

        train = self.field["TRAIN"]
        if train is not None and self.oos_pts is not None and len(train) > 0 and len(self.oos_pts) > 0:
            try:
                tree = cKDTree(train.astype(np.float32))
                dists, _ = tree.query(self.oos_pts.astype(np.float32), k=1)
                candidates = self.oos_pts[dists <= overlap_radius]
                if candidates.size > 0:
                    self.seed_mode = "overlap"
                    if self.args.overlap_limit and len(candidates) > self.args.overlap_limit:
                        idx = self.rng.choice(len(candidates), size=int(self.args.overlap_limit), replace=False)
                        candidates = candidates[idx]
                    self.seed_points = candidates.astype(np.float32)
            except Exception as exc:
                print("[seed] overlap failed:", exc)

        if self.seed_mode == "overlap" and self.seed_points is not None:
            if self.args.oos_seed_limit > 0 and len(self.seed_points) > self.args.oos_seed_limit:
                idx = self.rng.choice(len(self.seed_points), size=self.args.oos_seed_limit, replace=False)
                self.seed_points = self.seed_points[idx]
            if self.args.oos_fill_count > 0 and self.oos_pts is not None:
                extras = densify_oos_surface(
                    base_pts=self.seed_points,
                    full_oos_pts=self.oos_pts,
                    amin=self.amin,
                    amax=self.amax,
                    extra_count=self.args.oos_fill_count,
                )
                if extras is not None and len(extras) > 0:
                    self.seed_points = np.concatenate([self.seed_points, extras], axis=0).astype(np.float32)

        if self.seed_mode == "overlap" and self.seed_points is not None:
            if overlap_sigma > 0:
                jitter = self.rng.standard_normal(self.seed_points.shape).astype(np.float32) * overlap_sigma
                self.P0 = np.clip(self.seed_points + jitter, self.amin, self.amax)
            else:
                self.P0 = np.clip(self.seed_points, self.amin, self.amax)
        else:
            self.n_axis = max(2, self.G // max(1, self.args.stride))
            self.P0 = lattice_positions(
                self.n_axis,
                self.amin,
                self.amax,
                margin=0.02,
                jitter=self.args.respawn_jitter,
                seed=2025,
            )

        self.P = self.P0.copy()
        self.Np = len(self.P)
        self.base_ttl_lo = max(8, 60 // 2)
        self.base_ttl_hi = 60
        self.ttl_scale = 1.0
        self.ttl = self._sample_ttl(self.Np)
        self.ages = self.rng.integers(0, np.maximum(1, self.ttl), size=self.Np, dtype=np.int32)
        self.ent_prev = self.sampler_mean.sample_scalar(self.ENT, self.P).astype(np.float32) if self.ENT is not None else None
        self.ent_d_ema = np.zeros(self.Np, np.float32) if self.ENT is not None else None

    def _sample_ttl(self, n: int) -> np.ndarray:
        base = self.rng.integers(self.base_ttl_lo, self.base_ttl_hi + 1, size=int(n))
        return np.maximum(1, np.round(base * self.ttl_scale)).astype(np.int32)

    def _prepare_oos_distance(self) -> None:
        self.OOS_DIST = None
        self.sampler_oosdist = None
        self.far_oos_params = None
        if self.args.no_far_from_oos or self.oos_pts is None or len(self.oos_pts) == 0:
            return
        Ng = int(max(8, self.args.oos_dist_grid))
        tree_oos = cKDTree(self.oos_pts.astype(np.float32))
        gridP = lattice_positions(Ng, self.amin, self.amax, margin=0.0, jitter=0.0, seed=0)
        dists, _ = tree_oos.query(gridP, k=1)
        self.OOS_DIST = dists.reshape(Ng, Ng, Ng).astype(np.float32)
        self.sampler_oosdist = TriLinearSampler(np.zeros((Ng, Ng, Ng, 3), np.float32), self.amin, self.amax)
        self.far_oos_params = {
            "d0": float(self.args.oos_dist_thresh_frac) * self.diag,
            "gamma": float(self.args.oos_dist_gamma),
            "boost": float(self.args.oos_death_boost),
        }

    def _setup_vtk(self) -> None:
        init_rgba = np.tile(np.array([[255, 255, 255, 48]], np.uint8), (self.Np, 1))
        self.points, self.color_arr, self.poly, self.p_actor = build_cloud(self.P, point_size=2.0, rgba=init_rgba)

        self.ren = vtk.vtkRenderer()
        self.ren.SetBackground(0, 0, 0)
        self.ren.AddActor(self.p_actor)

        self.win = vtk.vtkRenderWindow()
        self.win.SetOffScreenRendering(1)
        self.win.AddRenderer(self.ren)
        self.win.SetSize(self.args.window_size[0], self.args.window_size[1])
        self.win.SetWindowName("mindVisualizer Live")

        self.iren = vtk.vtkRenderWindowInteractor()
        self.iren.SetRenderWindow(self.win)
        self.iren.SetInteractorStyle(vtkInteractorStyleTrackballCamera())
        self.iren.Initialize()

        self.o_actor = None
        if self.oos_pts is not None and len(self.oos_pts) > 0:
            rgb_oos = np.tile(np.array([[255, 255, 255]], np.uint8), (len(self.oos_pts), 1))
            oos_rgba = np.concatenate([rgb_oos, np.full((len(self.oos_pts), 1), 72, np.uint8)], axis=1)
            _, _, _, self.o_actor = build_cloud(self.oos_pts, point_size=1.5, rgba=oos_rgba, opacity=72 / 255.0)

        self.flow_mesh = None
        try:
            self.flow_mesh = FlowMeshOverlay(ren=self.ren, win=self.win, mesh_dir=MESH_DIR, alignment_file=ALIGNMENT_FILE)
            grid_cache = DATA_DIR / "label_grid_cache.npz"
            if not self.flow_mesh.load_label_grid(grid_cache):
                self.flow_mesh.build_label_grid()
                self.flow_mesh.save_label_grid(grid_cache)
            if self.flow_mesh.get_all_region_keys():
                self.flow_mesh.cycle(+1)
        except Exception as exc:
            print("[flow mesh] disabled:", exc)

        self.text_overlay = VtkTextOverlay(self.ren)
        self.probe_sys = ProbeSystem(self.ren, self.win, self.amin, self.amax)
        if self.flow_mesh is not None:
            self.probe_sys.set_mesh_overlay(self.flow_mesh)
        self.probe_sys.set_multi_count(self.args.multi_probe)
        if self.args.branching and self.PI is not None:
            self.probe_sys.set_branching(True, pi_field=self.PI, mus_samplers=self.samplers_comp)

        add_window_legend(
            self.ren,
            [
                "mindVisualizer live Python/VTK",
                "space pause | f field | v colour | m cmap | q/w mesh | hide",
                "[ ] dt | +/- speed | 1/2 lifetime | 7/8 alpha | y/u/z/x filter",
                "o OOS | j clip | a/d frac | probe | analyze | clear",
            ],
            font_px=12,
        )
        self.ren.ResetCamera()
        for _ in range(12):
            V = self.sampler_mean.sample_vec(self.P)
            self.P = wrap_inside(
                self.P + V * (self.args.dt * self.args.speed_scale) * (self.target_step / max(self.vmax_mean, 1e-9)),
                self.amin,
                self.amax,
                margin_frac=self.args.margin,
            )
        if self.ENT is not None:
            self.ent_prev = self.sampler_mean.sample_scalar(self.ENT, self.P).astype(np.float32)
            self.ent_d_ema[:] = 0.0
        self.win.Render()

    def current_sampler(self) -> TriLinearSampler:
        return self.sampler_by_name.get(self.field_mode, self.sampler_mean)

    def vmax_for_mode(self) -> float:
        return self.vmax_by_name.get(self.field_mode, self.vmax_mean)

    def map_rgb_from_t(self, t01: np.ndarray) -> np.ndarray:
        return rainbow_rgb01(t01) if self.cmap_mode == "RAINBOW" else turbo_rgb01(t01)

    def apply_colors(self, speed_vals: np.ndarray, P_world: np.ndarray, dent_vals=None, vis_mask=None) -> None:
        eps = 1e-12
        if self.colour_mode == "ENTROPY" and self.ENT is not None:
            scal = self.sampler_mean.sample_scalar(self.ENT, P_world)
            t = (scal - self.ent_min) / max(self.ent_max - self.ent_min, eps)
            base_rgb = self.map_rgb_from_t(np.clip(t, 0, 1))
        elif self.colour_mode == "DELTA_ENTROPY" and dent_vals is not None:
            a = np.abs(dent_vals)
            scale = float(np.percentile(a, 97)) if a.size else 1.0
            if not np.isfinite(scale) or scale <= eps:
                scale = 1.0
            base_rgb = self.map_rgb_from_t(np.clip(a / scale, 0, 1))
        elif self.colour_mode == "DIR_DELTA_ENTROPY" and dent_vals is not None:
            base_rgb = bicolor_white_center(dent_vals)
        else:
            smin = float(np.min(speed_vals)) if speed_vals.size else 0.0
            smax = float(np.max(speed_vals)) if speed_vals.size else 1.0
            t = (speed_vals - smin) / max(smax - smin, eps)
            base_rgb = self.map_rgb_from_t(np.clip(t, 0, 1))

        alpha = int(np.clip(255.0 * self.mdn_alpha, 5, 255))
        a = np.full(len(base_rgb), alpha, np.uint8)
        if vis_mask is not None:
            a = a.copy()
            a[~vis_mask] = 0
        rgba = np.concatenate([base_rgb, a[:, None]], axis=1).astype(np.uint8)
        self.color_arr.DeepCopy(numpy_to_vtk(rgba, deep=True))
        self.color_arr.Modified()
        self.poly.Modified()

    def step(self) -> None:
        if self.gpt_pending is not None:
            result = self.gpt_pending
            self.gpt_pending = None
            self.probe_busy = False
            self.text_overlay.show_gpt(result)
            self.text_overlay.add_log("GPT analysis complete")

        if self.paused:
            self.win.Render()
            return

        sampler = self.current_sampler()
        Vraw = sampler.sample_vec(self.P)
        vmx = float(self.vmax_for_mode())
        if self.clip_on:
            thr = float(max(1e-9, self.clip_frac * vmx))
            speed = np.linalg.norm(Vraw, axis=1)
            k = np.minimum(1.0, thr / (speed + 1e-9)).astype(np.float32)
            Vstep = Vraw * k[:, None]
            eff_vmax = min(vmx, thr)
        else:
            Vstep = Vraw
            eff_vmax = vmx

        step_size = self.args.dt * self.args.speed_scale * (self.target_step / max(eff_vmax, 1e-9))
        self.P = wrap_inside(self.P + Vstep * step_size, self.amin, self.amax, margin_frac=self.args.margin)

        dent = None
        if self.ENT is not None:
            ent_now = self.sampler_mean.sample_scalar(self.ENT, self.P).astype(np.float32)
            d = ent_now - self.ent_prev
            self.ent_d_ema = (1.0 - 0.2) * self.ent_d_ema + 0.2 * d
            self.ent_prev = ent_now
            dent = self.ent_d_ema

        age_inc = np.ones(len(self.P), np.int32)
        if self.sampler_oosdist is not None and self.OOS_DIST is not None and self.far_oos_params is not None:
            d_oos = self.sampler_oosdist.sample_scalar(self.OOS_DIST, self.P).astype(np.float32)
            d0 = max(1e-9, self.far_oos_params["d0"])
            t = np.clip((d_oos - d0) / d0, 0.0, 1.0)
            gate = np.power(t, float(max(0.1, self.far_oos_params["gamma"]))).astype(np.float32)
            age_inc += np.floor(gate * float(max(0.0, self.far_oos_params["boost"])) + 1e-9).astype(np.int32)
        self.ages += age_inc

        dead = self.ages >= self.ttl
        if np.any(dead):
            if self.seed_mode == "overlap" and self.seed_points is not None and len(self.seed_points) > 0:
                sel = self.rng.integers(0, len(self.seed_points), size=dead.sum())
                base = self.seed_points[sel]
                if self.args.overlap_jitter > 0:
                    sigma = float(self.args.overlap_jitter) * max(self.diag, 1e-9)
                    jitter = self.rng.standard_normal((dead.sum(), 3)).astype(np.float32) * sigma
                    self.P[dead] = np.clip(base + jitter, self.amin, self.amax)
                else:
                    self.P[dead] = np.clip(base, self.amin, self.amax)
            else:
                jitter_world = (self.amax - self.amin) * (self.args.respawn_jitter / max((self.n_axis or 2) - 1, 1))
                jitter = (self.rng.random((dead.sum(), 3)).astype(np.float32) - 0.5) * 2.0 * jitter_world
                self.P[dead] = np.clip(self.P0[dead] + jitter, self.amin, self.amax)
            self.ages[dead] = 0
            self.ttl[dead] = self._sample_ttl(dead.sum())
            if self.ENT is not None:
                self.ent_prev[dead] = self.sampler_mean.sample_scalar(self.ENT, self.P[dead]).astype(np.float32)
                self.ent_d_ema[dead] = 0.0

        if self.probe_sys.active:
            self.probe_sys.step(sampler, step_size)

        speed = np.linalg.norm(Vstep, axis=1)
        if self.filter_mode == "OFF":
            vis_mask = np.ones(len(self.P), dtype=bool)
        else:
            vis_mask = compute_fraction_mask(speed, self.filter_frac, top=self.filter_top)

        self.points.SetData(numpy_to_vtk(self.P, deep=True))
        self.points.Modified()
        self.apply_colors(speed, self.P, dent_vals=dent, vis_mask=vis_mask)
        self.win.Render()

    def cycle_field(self) -> str:
        idx = self.field_modes.index(self.field_mode)
        self.field_mode = self.field_modes[(idx + 1) % len(self.field_modes)]
        return self.field_mode

    def cycle_colour(self) -> str:
        modes = ["SPEED"]
        if self.ENT is not None:
            modes += ["ENTROPY", "DELTA_ENTROPY", "DIR_DELTA_ENTROPY"]
        idx = modes.index(self.colour_mode) if self.colour_mode in modes else 0
        self.colour_mode = modes[(idx + 1) % len(modes)]
        return self.colour_mode

    def place_probe_center(self) -> None:
        pos = ((self.amin + self.amax) * 0.5).astype(np.float32)
        self.probe_sys.place(pos)
        self.text_overlay.add_log("Probe placed at brain center")

    def analyze_probe(self, use_rag: bool) -> None:
        if not self.probe_sys.active or self.flow_mesh is None or self.probe_busy:
            self.text_overlay.add_log("No probe ready to analyze")
            return
        self.probe_sys.freeze()
        snapshots = []
        for probe in self.probe_sys.get_all_probes():
            if not probe.path or len(probe.path) < 3:
                continue
            snapshots.append(
                {
                    "path": probe.get_path_array().copy(),
                    "field_mags": probe.get_field_mags_array().copy(),
                    "ghost": probe.ghost,
                    "label": probe.label,
                }
            )
        if not snapshots:
            self.text_overlay.add_log("No probe data")
            return
        self.probe_busy = True
        self.text_overlay.add_log("Analyzing probe path...")
        threading.Thread(target=self._analyze_async, args=(snapshots, use_rag), daemon=True).start()

    def _analyze_async(self, snapshots, use_rag: bool) -> None:
        try:
            transitions = []
            for snap in snapshots:
                transitions.extend(
                    analyze_probe_path(
                        snap["path"],
                        self.flow_mesh,
                        sample_every=5,
                        field_mags=snap["field_mags"] if len(snap["field_mags"]) == len(snap["path"]) else None,
                        entropy_sampler=self.sampler_mean if self.ENT is not None else None,
                        entropy_field=self.ENT,
                    )
                )
            if not transitions:
                self.gpt_pending = "No brain regions detected along probe path."
                return
            self.gpt_pending = analyze_with_gpt(transitions, use_rag=use_rag, model=self.args.model, debug=False)
        except Exception as exc:
            self.gpt_pending = f"[GPT ERROR] {exc}"

    @property
    def status(self) -> str:
        mesh_count = len(self.flow_mesh.get_all_region_keys()) if self.flow_mesh else 0
        return (
            f"{self.field_mode} | {self.colour_mode} | "
            f"{self.Np:,} particles | {mesh_count} meshes | "
            f"{'paused' if self.paused else 'running'}"
        )


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="MindVisualizer Trame live server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "7860")))
    parser.add_argument("--meta", type=Path, default=DEFAULT_META)
    parser.add_argument("--oos", type=Path, default=DEFAULT_OOS)
    parser.add_argument("--fps", type=int, default=int(os.environ.get("MINDVIS_FPS", "18")))
    parser.add_argument("--stride", type=int, default=3)
    parser.add_argument("--dt", type=float, default=1.0)
    parser.add_argument("--max-step-frac", type=float, default=0.01)
    parser.add_argument("--speed-scale", type=float, default=1.0)
    parser.add_argument("--margin", type=float, default=0.0)
    parser.add_argument("--respawn-jitter", type=float, default=0.015)
    parser.add_argument("--oos-seed-limit", type=int, default=50000)
    parser.add_argument("--oos-fill-count", type=int, default=10000)
    parser.add_argument("--overlap-frac", type=float, default=0.01)
    parser.add_argument("--overlap-jitter", type=float, default=0.002)
    parser.add_argument("--overlap-limit", type=int, default=200000)
    parser.add_argument("--no-far-from-oos", action="store_true")
    parser.add_argument("--oos-dist-grid", type=int, default=96)
    parser.add_argument("--oos-dist-thresh-frac", type=float, default=0.009)
    parser.add_argument("--oos-dist-gamma", type=float, default=3.0)
    parser.add_argument("--oos-death-boost", type=float, default=8.0)
    parser.add_argument("--multi-probe", type=int, default=1)
    parser.add_argument("--branching", action="store_true")
    parser.add_argument("--window-size", type=int, nargs=2, default=[1320, 820])
    parser.add_argument("--model", default=os.environ.get("OPENAI_MODEL", "gpt-5.4-mini"))
    parser.add_argument("--rag", action="store_true")
    return parser


def main() -> None:
    ensure_ssl()
    args = build_arg_parser().parse_args()

    from trame.app import get_server
    from trame.ui.vuetify3 import SinglePageLayout
    from trame.widgets import html, vtk as vtk_widgets, vuetify3

    app = LiveMindVisualizer(args)
    server = get_server(client_type="vue3")
    state, ctrl = server.state, server.controller
    state.trame__title = "MindVisualizer Live"
    state.status = app.status

    def refresh_status() -> None:
        state.status = app.status
        state.flush()

    def update_view() -> None:
        if hasattr(ctrl, "view_update"):
            ctrl.view_update()
        refresh_status()

    @ctrl.add("toggle_pause")
    def toggle_pause(**_):
        app.paused = not app.paused
        update_view()

    @ctrl.add("cycle_field")
    def cycle_field(**_):
        app.cycle_field()
        update_view()

    @ctrl.add("cycle_colour")
    def cycle_colour(**_):
        app.cycle_colour()
        update_view()

    @ctrl.add("cycle_cmap")
    def cycle_cmap(**_):
        app.cmap_mode = "RAINBOW" if app.cmap_mode == "TURBO" else "TURBO"
        update_view()

    @ctrl.add("mesh_prev")
    def mesh_prev(**_):
        if app.flow_mesh:
            app.flow_mesh.cycle(-1)
        update_view()

    @ctrl.add("mesh_next")
    def mesh_next(**_):
        if app.flow_mesh:
            app.flow_mesh.cycle(+1)
        update_view()

    @ctrl.add("mesh_hide")
    def mesh_hide(**_):
        if app.flow_mesh:
            app.flow_mesh.hide()
        update_view()

    @ctrl.add("mesh_alpha_down")
    def mesh_alpha_down(**_):
        if app.flow_mesh:
            app.flow_mesh.set_opacity(1.0 / 1.25)
        update_view()

    @ctrl.add("mesh_alpha_up")
    def mesh_alpha_up(**_):
        if app.flow_mesh:
            app.flow_mesh.set_opacity(1.25)
        update_view()

    @ctrl.add("toggle_oos")
    def toggle_oos(**_):
        if app.o_actor is not None:
            if app.oos_visible:
                app.ren.RemoveActor(app.o_actor)
            else:
                app.ren.AddActor(app.o_actor)
            app.oos_visible = not app.oos_visible
        update_view()

    @ctrl.add("place_probe")
    def place_probe(**_):
        app.place_probe_center()
        update_view()

    @ctrl.add("analyze_probe")
    def analyze_probe(**_):
        app.analyze_probe(use_rag=args.rag)
        update_view()

    @ctrl.add("clear_probe")
    def clear_probe(**_):
        app.probe_sys.clear()
        app.text_overlay.clear_log()
        app.text_overlay.hide_gpt()
        update_view()

    @ctrl.add("reset_camera")
    def reset_camera(**_):
        if hasattr(ctrl, "view_reset_camera"):
            ctrl.view_reset_camera()
        update_view()

    async def animation_loop():
        delay = 1.0 / max(1, int(args.fps))
        while True:
            app.step()
            if hasattr(ctrl, "view_update"):
                ctrl.view_update()
            state.status = app.status
            state.flush()
            await asyncio.sleep(delay)

    ctrl.on_server_ready.add(lambda **_: asyncio.create_task(animation_loop()))

    with SinglePageLayout(server) as layout:
        layout.title.set_text("MindVisualizer Live")
        with layout.toolbar:
            vuetify3.VBtn("Pause", click=ctrl.toggle_pause, density="compact", variant="tonal")
            vuetify3.VBtn("Field", click=ctrl.cycle_field, density="compact", variant="tonal")
            vuetify3.VBtn("Colour", click=ctrl.cycle_colour, density="compact", variant="tonal")
            vuetify3.VBtn("Cmap", click=ctrl.cycle_cmap, density="compact", variant="tonal")
            vuetify3.VDivider(vertical=True, classes="mx-2")
            vuetify3.VBtn("Mesh -", click=ctrl.mesh_prev, density="compact", variant="tonal")
            vuetify3.VBtn("Mesh +", click=ctrl.mesh_next, density="compact", variant="tonal")
            vuetify3.VBtn("Hide", click=ctrl.mesh_hide, density="compact", variant="tonal")
            vuetify3.VBtn("Alpha -", click=ctrl.mesh_alpha_down, density="compact", variant="tonal")
            vuetify3.VBtn("Alpha +", click=ctrl.mesh_alpha_up, density="compact", variant="tonal")
            vuetify3.VDivider(vertical=True, classes="mx-2")
            vuetify3.VBtn("OOS", click=ctrl.toggle_oos, density="compact", variant="tonal")
            vuetify3.VBtn("Probe", click=ctrl.place_probe, density="compact", variant="tonal")
            vuetify3.VBtn("Analyze", click=ctrl.analyze_probe, density="compact", variant="tonal")
            vuetify3.VBtn("Clear", click=ctrl.clear_probe, density="compact", variant="tonal")
            vuetify3.VSpacer()
            html.Div("{{ status }}", classes="text-caption text-medium-emphasis")

        with layout.content:
            with vuetify3.VContainer(fluid=True, classes="pa-0 fill-height", style="background: #000;"):
                view = vtk_widgets.VtkRemoteView(
                    app.win,
                    ref="view",
                    interactive_ratio=0.65,
                    interactive_quality=55,
                )
                ctrl.view_update = view.update
                ctrl.view_reset_camera = view.reset_camera

    server.start(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
