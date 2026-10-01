# Matrix

Independent retro dot-matrix watchface for round 480 × 480 Amazfit devices, designed at 480 × 480. Version 0.1.2 uses local application ID `1092703`, separate from Essential.

## Display

- Fixed 24-hour time with 15 × 21 dot-matrix digits using the same 2 × 2 pixel LEDs as small values, with Italian or English weekday and date labels.
- Calories, last heart rate measurement, distance, battery and steps use native Zepp data widgets. Numeric field padding follows the native widgets rather than the reference image's decorative leading zeros.
- Distance uses the device's metric/imperial preference with a matching KM/MI heading.
- Battery and heart rate use native data-bound pointers. The heart scale follows Zepp's native HEART data range; it is a visual indicator rather than a clinical scale.
- Seconds replace the goal indicator: a two-digit counter and a native seconds hand completing a revolution each minute. The dial's right edge aligns with the minute digits.
- AOD shows only time and date, using dimmer digits without inactive dots. Seconds and activity widgets are normal-only.

Time/date refresh on the minute event and on resume. Subscription cleanup follows Essential's lifecycle pattern. Native Zepp widgets own activity and seconds updates; no JavaScript second timer or continuous heart measurement is started.

## Build and install

From the repository root, using Node 24.19.0 and Zeus CLI 1.9.3:

```sh
npm test
npm run test:packaging
npm run typecheck
npm run build -- matrix
```

The build validates and writes installation ZIPs into `dist/install/` for the complete 40-deviceSource [round 480 × 480 catalog](TARGETS.md). Select the ZIP matching the device source and install locally through Gadgetbridge. Matrix is covered by the validation workflow. Pushing `matrix-v0.1.2` starts an automatic release that builds and publishes Matrix only. Ordinary CI builds both watchfaces.

## Assets and previews

```sh
python3 scripts/render-matrix-assets.py
```

Pillow is an optional generation input. The generator uses the bundled Orbitron Medium font by default and generates original LED/hand assets and previews. Labels and dates render directly through Zepp's native text widgets with an explicit Orbitron TTF on supported devices. GTR 3 Pro variants use the system font because they lack custom TTF support. Dial outlines render through native arcs; host-side previews approximate native rasterization.

See [third-party notices](THIRD_PARTY_NOTICES.md) and [the font license](Orbitron-OFL.txt). The complete font license is included in installation ZIPs.


## Device validation

The 0.1.1 Orbitron/native-arc variant has been compiled and loaded in the Balance 2 simulator; physical validation of 0.1.1 is pending. The user confirmed a successful physical-device trial of 0.1.0 on Balance 2 XT with the `10486017` build on 2026-10-01. Detailed checks remain pending: verify installation and selection preview, midnight/date rollover, minute updates, seconds `59 → 00`, hand direction, heart/battery pointer updates, distance units, long activity values, sleep/resume and AOD transitions on Balance 2 XT. Check that native seconds widgets stop updating while AOD is active.

## Target policy

Follow the repository [device target and release policy](../../../docs/device-target-policy.md) for full round 480 × 480 catalog coverage, compatibility fallbacks and validation claims. This watchface is configured for the complete matching catalog.
