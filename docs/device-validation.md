# Balance 2 XT validation record

## Target evidence

| Field | Status | Evidence |
| --- | --- | --- |
| Intended model | Amazfit Balance 2 XT | Intended project target |
| Firmware | Pending | Record from the actual watch |
| deviceSource | 10486017 — confirmed by user | User confirmation on 2026-10-01; consistent with the Balance 2 XT catalog entry |
| Display resolution | Catalog evidence: round, 480 × 480 | Balance 2 XT entries in the local Zeus device catalog; physical confirmation pending |
| Watchface API | Classic watchface globals, minimum API 1.0.0 | Documented hmUI/hmSensor/hmSetting APIs; physical compatibility pending |
| Local appId | 1092702 | Local development identity for Gadgetbridge installation, not portal-issued |

Do not reuse an appId or deviceSource from an earlier chat without current evidence.

## Validation results

| Check | Status | Evidence to retain |
| --- | --- | --- |
| Unit tests | Passed locally | npm test: 8 tests, including actual entrypoint and release configuration; packaging tests run separately |
| Strict typecheck | Passed locally | TypeScript 5.9.3, npm run typecheck |
| Build and package inspection | Passed locally | Node 24.19.0, Zeus 1.9.3; Essential 0.1.3, appId 1092702, deviceSource 10486017; device ZIP identity, resources, preview and black padding checked |
| Simulator | Not run | Configuration and observed behavior |
| Physical installation | User confirmed for 0.1.0 | Installed through Gadgetbridge on Balance 2 XT; firmware still pending |
| Normal / AOD / wake | User confirmed watchface and AOD work and update correctly on 0.1.0 | AOD illuminated area and detailed wake-cycle checks remain pending |
| Switching away and back | Not run | Lifecycle cleanup and repeated transitions |
| 12/24-hour and date boundaries | Not run | Settings and observed output |
| Battery impact | Not measured | Measurement duration, conditions and comparison |

The configured target will be `10486017`. Physical installation of 0.1.0 is confirmed by the user; firmware verification remains pending.

## Catalog review — 2026-10-01

The local Zeus device catalog identifies the following variants. This is cached tooling evidence, not a live device reading or an installation result.

| deviceSource | Model | Catalog entry updated | Screen | Preview |
| --- | --- | --- | --- | --- |
| 10486016 | A2546 | 2025-06-11 | Round, 480 × 480 | 324 × 324 |
| 10486017 | A2546 | 2025-07-10 | Round, 480 × 480 | 324 × 324 |
| 10486019 | A2547 | 2025-07-10 | Round, 480 × 480 | 324 × 324 |

All three entries report Zepp OS 5.0 and API level 4.2. These catalog values do not establish installed firmware or select the watchface programming API.

The [public device list](https://docs.zepp.com/docs/reference/related-resources/device-list/), reviewed on this date, lists Balance 2 but does not separately list Balance 2 XT. Do not substitute Balance 2 identifiers for the XT variants.

The documented watchface API [hmSetting.getDeviceInfo()](https://docs.zepp.com/docs/watchface/api/hmSetting/getDeviceInfo/) returns `deviceSource`, `deviceName`, `width`, `height` and `screenShape`. A reading on the actual watch can resolve the target. Firmware must be recorded separately from the watch's device information.

## Preview validation — 2026-10-01

The user confirmed the watch selection preview in 0.1.1 is correct. Gadgetbridge still displayed a red stripe. Version 0.1.2 clears all RGB565 padding bits; the package and two regression tests pass locally. The user accepted the corrected Gadgetbridge preview.

## Expanded build targets — 2026-10-01

Essential 0.1.3 builds 40 deviceSource variants from the checked-in round 480 × 480 Zeus catalog. All 40 device ZIPs passed local identity, version, target and resource checks. Layout and runtime behavior are unchanged. Other devices are not physically verified; expanded GitHub release execution remains pending. Packaging tests now include supported shared groups and rejection of unlisted targets.
