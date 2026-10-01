# Device target and release policy

Watchfaces designed for a round 480 × 480 display should be built and released for every matching deviceSource in the checked-in Zeus catalog, rather than only the watch used for development. Balance 2 XT is the primary physical test device, not the default release boundary.

## Configuration

- Each watchface owns its `targets.json` and explicit `app.json` platform list. Keep these lists identical and include every variant of each matching model.
- The established catalog is recorded in [Essential's target catalog](../src/watchfaces/essential/targets.json), with model names in [TARGETS.md](../src/watchfaces/essential/TARGETS.md). It currently contains 40 deviceSource entries for round 480 × 480 screens.
- Screen shape matters as well as resolution. Do not include other shapes or resolutions just because a device name is similar.
- Review catalog changes explicitly. Builds and releases must not silently adopt new targets from a live catalog.
- A narrower target list requires a documented feature/firmware compatibility reason and an explicit scope decision. A watchface's test device alone is not such a reason.

## Compatibility

Matching display dimensions establish layout compatibility, not full API or firmware compatibility. Check custom fonts, sensor bindings, statuses, editable widgets and AOD behavior for older target families. Preserve features using an appropriate fallback where practical.

Custom TTF fonts are unavailable on the original GTR 3 Pro OS (deviceSource 229, 230, 242 and 6095106). Matrix uses the system font for labels/date on those variants while preserving bitmap digits and layout. Other watchfaces must evaluate their own font requirements before expanding targets.

Simulator-only targets and demo readings belong in disposable copies. Never add them to release manifests merely to run a preview.

## Release and evidence

A tag `<watchface>-v<version>` builds and publishes the selected watchface only. Publish an installation ZIP for each configured deviceSource, including the device model and source in the filename. Zeus may share one underlying binary package across compatible variants; preserve the package's original platform metadata.

Run tests, typecheck, builds and package inspection before release. Verify the remote workflow result and the complete published asset set after pushing a tag.

Describe physical-device, simulator and build-only validation separately. A successful Balance 2 XT test does not establish installation, firmware-specific rendering, AOD or battery behavior on every other device. Once published, preserve a release and its tag; deliver corrected target coverage in a new version.

## Current configuration

| Watchface | Configured target scope | Notes |
| --- | --- | --- |
| Essential | Full round 480 × 480 catalog | Primary physical evidence is Balance 2 XT. |
| Matrix 0.1.2 | Full round 480 × 480 catalog | System-font fallback for GTR 3 Pro. Other models require physical checks. |
| Retro LCD 0.1.6 | Full round 480 × 480 catalog | Bitmap typography does not require custom TTF support. Physical-device checks remain pending. |
