---
name: ECHO — Blind Cartographer
description: A seismic darkroom for navigating belief under threat.
colors:
  void: "hsl(195 18% 3%)"
  instrument: "hsl(188 17% 6%)"
  bone: "hsl(175 18% 88%)"
  mineral-cyan: "hsl(171 63% 62%)"
  deep-cyan: "hsl(193 24% 4%)"
  lichen: "hsl(147 42% 56%)"
  oxide: "hsl(6 71% 62%)"
  muted-ink: "hsl(178 9% 59%)"
  survey-line: "hsl(177 15% 20%)"
typography:
  display:
    fontFamily: "Oxanium, sans-serif"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope Variable, sans-serif"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.2em"
rounded:
  control: "2px"
  panel: "0px"
spacing:
  hairline: "1px"
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.instrument}"
    textColor: "{colors.mineral-cyan}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "hsl(184 13% 10%)"
    textColor: "{colors.bone}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  instrument-panel:
    backgroundColor: "{colors.instrument}"
    textColor: "{colors.bone}"
    rounded: "{rounded.panel}"
    padding: "20px"
---

<!-- THESIS: the belief field is the interface. OWN-WORLD: a damaged underground survey instrument in a seismic darkroom. STORY: stronger observations contract the player's posterior while sharpening the Hunter's estimate. FIRST VIEWPORT: title and half-submerged belief field; Play centers the probability cloud and keeps controls at the edges. FORM: signal-analysis contact sheet, position 7, direction seed b588b4c1. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->

# Design System: ECHO — Blind Cartographer

## Overview

**Creative North Star: "The Seismic Darkroom"**

ECHO behaves like a damaged underground survey instrument printing a map from echoes it cannot fully trust. The interface is not a dashboard wrapped around a game: the live belief field is the dominant surface, while controls behave like terse annotations at its edges.

The visual world joins independent science fiction, cave-survey notation, polar sonar scopes, LIDAR point clouds, acoustic lab plots, field notebooks, and Cold War signal-analysis contact sheets. It is quiet, exact, mysterious, and technically honest. It rejects generic dashboards, CRUD surfaces, textbook diagrams, conventional visible mazes, and saturated neon cyberpunk.

**Key Characteristics:**

- Near-black, tonal surfaces interrupted by hairline survey geometry.
- Mineral-cyan probability, lichen confirmation, and rare oxide danger.
- Particle clouds and signal waves carry meaning rather than decoration.
- Square, instrument-like composition with terse monospaced captions.
- English and Simplified Chinese retain the same compact hierarchy.

## Colors

The palette reads like mineral traces exposed on dark recording film. Frontmatter tokens are normative; opacity variants may be derived for measured overlays.

### Primary

- **Mineral Cyan:** live probability, primary actions, selected states, focus outlines, sonar waves, and the clearest non-danger emphasis.

### Secondary

- **Lichen Confirmation:** verified structures, objectives, energy, and successful outcomes.
- **Oxide Warning:** Hunter truth, contact risk, destructive actions, and high-emission states. Pair it with text, icons, or form.

### Neutral

- **Void Graphite:** the continuous environmental ground.
- **Instrument Graphite:** subtly lifted analytical panels and controls.
- **Bone Signal:** primary readable text and true-player markers.
- **Muted Ink:** captions and secondary operational copy.
- **Survey Line:** borders, dividers, grid marks, and inactive control edges.

**The Sparse Signal Rule.** Bright colors are measurements, not decoration; keep most of every viewport in graphite and reserve chroma for evidence or state.

**The Two Threat Channels Rule.** Oxide marks true danger and immediate warnings; amber may show the Hunter's inferred belief so estimate and truth remain distinguishable.

## Typography

- **Display Font:** Oxanium with sans-serif fallback
- **Body Font:** Manrope Variable with sans-serif fallback
- **Label/Mono Font:** IBM Plex Mono with monospace fallback

**Character:** Oxanium feels engineered without becoming arcade chrome. Manrope stays calm and readable, while IBM Plex Mono turns every caption and number into a survey annotation.

### Hierarchy

- **Display** (400–500, responsive 2.25–6rem, tight line-height): the ECHO wordmark and major route titles.
- **Headline** (400, 1.5–3.75rem): section statements and mode names.
- **Body** (400, 0.875–1rem, 1.75 line-height): explanation with a preferred maximum of 65 characters.
- **Label** (400–500, 10px, 0.14–0.2em tracking, uppercase): metrics, navigation, sensor metadata, legends, and buttons.
- **Micro annotation** (400, 7–9px, 0.06–0.18em tracking): compact canvas legends, mobile telemetry, and dense sensor consequences only; never body copy or a primary action.
- **Value** (400, 0.75–0.875rem, tabular numbers): energy, entropy, signature, seeds, and coordinates.

**The Instrument Voice Rule.** Play copy is terse and operational; Lab and X-Ray may use plain mathematical language. Chinese should be naturally compact, not mechanically literal.

## Layout

The application uses a maximum reading frame of 1440–1540px for analytical pages and a full-viewport canvas for Play. Primary pages begin below a fixed 64px navigation bar. Spacing follows an 8/12/20/32px rhythm, with 1px gaps and borders used as deliberate measurement marks.

Play places the belief field in the center, metrics at the top, sensors to the left, objectives to the right, and movement at the bottom. On mobile, sensor cards form a horizontal rail and a compact three-column strip preserves cores, objective bearing/strength, and qualitative Hunter state. Never hide a run-critical state during responsive collapse.

Analytical pages use asymmetric grids: a dominant map or narrative surface paired with narrower controls or charts. Dense metrics may become flat adjacent cells, but the composition must still read as a research instrument rather than a card dashboard.

## Elevation & Depth

The system is tonal and flat by default. Depth comes from darker-to-lighter graphite layers, translucent backdrops, restrained blur, border contrast, vignettes, and one deep ambient panel shadow (`0 18px 52px rgba(0,0,0,0.36)`). The canvas sits spatially behind the HUD; overlays never look like glossy floating cards.

**The Darkroom Rule.** Shadows describe equipment depth, not luxury elevation. Avoid stacked drop shadows, glowing containers, and high-contrast glass effects.

## Shapes

Panels are square (`0px`). Interactive controls use only a barely softened `2px` corner. One-pixel borders, corner registration marks, small rotated squares, fine radar circles, and path lines provide the recurring geometry. Circular forms belong to waves, particles, points, or measurements—not generic pills.

**The No-Pill Rule.** Do not use rounded capsules for ordinary labels, navigation, filters, or actions.

## Components

### Buttons

- **Shape:** a 44px control with 2px corners, 1px border, and monospaced uppercase label.
- **Primary:** transparent mineral-cyan wash, cyan text, and cyan border; hover strengthens fill and border.
- **Secondary:** muted graphite fill and survey-line border.
- **Ghost:** transparent border at rest; hover reveals muted fill and border.
- **Danger:** oxide text and border with a low-opacity oxide fill.
- **Focus / active:** a 1px cyan focus outline with a 4px offset; active movement is one pixel downward. Disabled controls retain their wording at 35% opacity.

### Cards / Containers

Instrument panels use a dark diagonal graphite gradient, 1px translucent survey border, square corners, and an ambient deep shadow. Internal padding is normally 16–20px. Flat metric strips share borders and use 1px gaps rather than individual floating cards.

### Inputs / Fields

Sliders, switches, and seed fields keep square or minimally softened geometry. Inactive tracks and strokes use Survey Line; selected state and focus use Mineral Cyan. Labels must state units and current values rather than relying on position or color.

### Navigation

Desktop navigation is a fixed 64px hairline-separated bar with a spaced Oxanium wordmark and restrained mono links. The active route becomes cyan. Mobile replaces the link row with one descriptive menu button and a square instrument panel containing navigation and accessibility controls.

### Belief Field

Particles, probability density, structure memory, scan likelihood, and Hunter belief share a coordinate system but have distinct marks. Normal Play never reveals true state. X-Ray uses bone for the true player, oxide for the true Hunter, mineral cyan for player particles, blue-violet for observation likelihood, and amber for Hunter belief; every role also appears in a text legend.

X-Ray places playback controls between the page header and map, with a compact two-row control layout on mobile. A paused field renders only when its content or size changes. System reduced motion suppresses the Play sonar pulse. Canvas loading and retry messages use body-sized text, and the intro keeps background controls inert until dismissed.

Storage failure feedback is a flat, bordered message row above the debrief or replay, with a secondary JSON download action. It states that the run is temporary and asks the player to save a backup before reloading. Clipboard denial exposes the actual seed as selectable text. Every recovery message and control has equivalent English and Simplified Chinese copy.

### Sensor Card

Each sensor card always names three consequences: expected information, energy cost, and signal emitted. The values Low, Medium, and High remain visible on mobile so emission risk is not color-only. Sonar may add an oxide line because the text already identifies its high signal.

## Do's and Don'ts

### Do:

- **Do** let real belief distributions, likelihood fields, paths, and waves create the visual interest.
- **Do** keep the first viewport dominated by one clear field or statement.
- **Do** preserve cores, objective bearing/strength, and Hunter state on every Play layout.
- **Do** use tabular numeric typography for changing measurements.
- **Do** preserve visible focus, reduced-motion behavior, high contrast, mute, and reduced-particle controls.
- **Do** pair every dangerous or uncertain color with text, iconography, geometry, or a legend.

### Don't:

- **Don't** reveal true position, true map, objective coordinates, or Hunter position in normal Play.
- **Don't** turn pages into uniform card grids or surround the game with dashboard chrome.
- **Don't** use gradients as ornamental page fills; reserve them for atmospheric canvas depth and instrument surfaces.
- **Don't** introduce saturated multi-neon palettes, glassmorphism, thick borders, pills, or excessive rounding.
- **Don't** fabricate mathematical values, telemetry, performance claims, or sensor feedback.
- **Don't** use decoration that competes with particle density, map memory, or threat state.
