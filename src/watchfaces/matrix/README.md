# Matrix

Independent retro dot-matrix watchface for Amazfit Balance 2 XT, designed at 480 × 480. Version 0.1.0 uses local application ID `1092703`, separate from Essential.

## Display

- Fixed 24-hour dot-matrix time, with Italian or English weekday and date labels.
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

The build validates and writes installation ZIPs into `dist/install/` for Balance 2 XT variants `10486016`, `10486017` and `10486019`. Select the ZIP matching the device source and install locally through Gadgetbridge. Matrix is covered by the validation workflow. Pushing `matrix-v0.1.0` starts an automatic release that builds and publishes Matrix only. Ordinary CI builds both watchfaces.

## Assets and previews

```sh
python3 scripts/render-matrix-assets.py /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
```

Pillow and the indicated font are optional generation inputs, not runtime dependencies. Original dot glyphs and dial artwork are generated into `assets/balance-2-xt/`; screenshots are composed from the same assets in `docs/previews/matrix-normal.png` and `docs/previews/matrix-aod.png`. Native widget formatting and on-device date font metrics can differ from the static composition. See [third-party notices](THIRD_PARTY_NOTICES.md) for raster label typography attribution.

## Device validation

The user confirmed a successful physical-device trial on Balance 2 XT with the `10486017` build on 2026-10-01. Detailed checks remain pending: verify installation and selection preview, midnight/date rollover, minute updates, seconds `59 → 00`, hand direction, heart/battery pointer updates, distance units, long activity values, sleep/resume and AOD transitions on Balance 2 XT. Check that native seconds widgets stop updating while AOD is active.
