# Performance

Benchmarks were run with `pnpm benchmark` on 2026-09-19 using Apple M4, Darwin arm64, Node v24.18.0, 30 deterministic rounds.

| Operation | Mean | p95 |
| --- | ---: | ---: |
| 48 × 48 facility generation | 1.054 ms | 1.553 ms |
| 10,000-particle sonar likelihood update, normalization, ESS, and conditional resample | 2.856 ms | 3.768 ms |

The benchmark isolates the TypeScript inference package and uses `performance.now()`. It does not claim browser render FPS. Normal difficulties use 900–1,500 live particles and replay frames downsample to roughly 280 particles. PixiJS caps device pixel ratio at 2, reuses its WebGL application across simulation updates, and caps Play rendering at 30 FPS. The Home ambient canvas also caps at 30 FPS, stops outside the viewport or while the page is hidden, and renders a static field when reduced motion is requested. The `?debug=1` HUD separately reports live FPS, average render time, measured turn-update time, particle count, and approximate serialized simulation-state size on the current browser.

Because the measured 10,000-particle core update is well below a 16.7 ms frame on the tested machine and game actions are turn-based, the current implementation does not add Worker messaging overhead. `InferenceEngine`, `TypeScriptInferenceEngine`, and an honest unavailable `WasmInferenceEngine` preserve the performance seam. WASM is not loaded or claimed.

## Replay rendering and archive reads

The September 19 update leaves the simulation algorithm unchanged. The performance work targets redundant UI work:

- X-Ray previously started a Pixi ticker capped at 20 FPS even while paused. It now initializes with `autoStart: false` and coalesces frame, particle-setting, container-size, and visibility changes into a single animation-frame render. Hidden tabs defer drawing until visible. Play retains its 30 FPS cap for sonar animation, which now respects system reduced motion.
- Both charts are memoized by their immutable frame array. Cursor-only updates do not reconstruct their series; locale and frame-data changes still update them.
- Local archives are parsed and validated once per changed storage string. Later route reads reuse the validated objects, while external storage changes invalidate the cache.

Regression measurements use a mocked renderer and chart boundaries, not GPU profiling: the X-Ray lifecycle test observes one render followed by zero additional renders during 5 seconds of simulated idle time, then one render for a new frame. The chart test observes one render per chart across the initial render plus ten cursor-like parent updates, followed by fresh renders on locale and data changes. These verify scheduling and React update behavior; they do not claim a battery, GPU-time, or Core Web Vitals improvement on every device.
