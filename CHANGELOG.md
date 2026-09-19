# Changelog

All notable project changes are documented here.

## 2026-09-19 — Replay performance and recovery

- Render X-Ray only when its frame, size, visibility, or particle settings change. Reuse the renderer while scrubbing and pause playback when the tab is hidden.
- Avoid recomputing replay charts during cursor-only changes, while preserving language and data updates.
- Place playback controls above the map, stop at the last frame, pause on scrubbing, and restart predictably.
- Validate stored chart values, score inputs, grids, particles, and positions. Reuse unchanged archive data across routes.
- Keep failed saves available in memory, preserve existing saved history, and offer a translated notice and JSON backup download. JSON import remains unsupported.
- Keep language and accessibility preferences usable when browser storage is blocked; ignore malformed persisted preference values.
- Add selectable-seed feedback for clipboard failure, translated canvas labels and retry states, safe cleanup during asynchronous graphics initialization, reduced-motion sonar, and protected intro focus.
- Use the frozen lockfile in the one-command launcher.
- Expand regression coverage to 38 unit/component tests and 13 passing desktop/mobile browser journeys, with one intentionally skipped desktop instance of a mobile-only test.

## 1.0.0 — 2026-09-03

### Added

- Complete deterministic hidden-map exploration and survival loop.
- Sequential Monte Carlo player localization and a separate Bayesian Hunter belief.
- Four sensor likelihood models with energy, cooldown, signature, and expected-information tradeoffs.
- Seeded procedural facilities, Daily Echo, local run archive, debrief, and X-Ray replay.
- Interactive Probability Lab with explicit filter phases and adjustable parameters.
- English and Simplified Chinese interface parity.
- Responsive desktop/mobile HUD, keyboard and touch controls, generated audio, reduced-motion and high-contrast support.
- Vitest engine/component coverage, Playwright product journeys, deterministic benchmarks, and GitHub Actions quality gates.

### Hardened

- Persistent WebGL renderer with capped frame rate and visibility-aware ambient rendering.
- Validated replay storage with graceful loading, empty, and corrupted-data states.
- Semantic links and controls, visible focus, skip navigation, accessible replay timeline, and mobile debug containment.
