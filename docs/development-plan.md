# Development plan

Date: 2026-10-01

## Scope

Create a maintainable personal watchface portfolio, starting with one small Balance 2 XT watchface. Establish a clean baseline for project code and validate each feature incrementally.

## Architecture

- One independently buildable directory per watchface under `src/watchfaces/<name>/`.
- `app.json` owns app identity, version, permissions, API requirements and explicit device targets.
- `watchface/index.js` coordinates lifecycle and rendering. Extract component/layout files only when they make the implementation clearer.
- Keep pure time/date logic independently testable. Keep device API access at the boundary.
- Place assets within each watchface. Add generators when repeated assets justify them and record font/artwork provenance.
- Avoid a rendering framework, cross-watchface imports and broad copied API declarations.
- Select the documented watchface API after verifying required features and device compatibility. Do not derive API choice solely from the marketing OS version.

## Milestones

### 1. Verify the device and choose the first design

Record model, firmware, display characteristics and deviceSource with traceable evidence in `device-validation.md`. Confirm an owned app identity. Prepare and approve normal/AOD previews before substantial visual implementation.

Proposed first scope: time, date, 12/24-hour preference and AOD. Sensors, editable complications and themes follow only when requested and after the basic lifecycle works.

### 2. Add one executable watchface and toolchain

Implement the approved design and documented API contract. Pin verified Node, Zeus and TypeScript versions. Commit a lockfile when dependencies are introduced.

Provide root commands for explicit watchface selection, strict typecheck and meaningful tests. Build tooling must work from the repository root without depending on `INIT_CWD`. Keep packaging separate from publishing.

Tests should cover midnight/noon, 12/24-hour conversion, date boundaries, required missing-data behavior and cleanup of custom listeners/timers if introduced. Avoid suppressions that hide unresolved API contracts.

### 3. Validate locally and on the device

Run tests, strict typecheck, build and package inspection. Inspect identity, version, target and resource paths in the generated package. Record simulator results separately.

Install on Balance 2 XT and verify normal/AOD transitions, wake, switching away/back and preferences. Measure battery impact before making efficiency claims. Local checks alone do not complete this milestone.

### 4. Extend and automate

Add features incrementally after device validation. Extract shared code only when an actual second consumer appears. Add CI for tests, typecheck and relevant builds; shared-source changes must trigger affected validation. Introduce release automation only when publication is requested.

## Evidence and licensing

Keep local, simulator and physical-device outcomes separate. Retain original attribution for reused material and establish applicable licensing before importing code or assets. Preserve the existing MIT license for current original work and document applicable licenses for any third-party material.

## Official references

Reviewed on 2026-10-01:

- [Watchface configuration](https://docs.zepp.com/docs/watchface/app-json/)
- [Device information](https://docs.zepp.com/docs/reference/related-resources/device-list/)
- [Watchface specification](https://docs.zepp.com/docs/watchface/specification/)

Confirm the current applicable specification during implementation. Assess the actual AOD illuminated area; a black background alone does not establish compliance.
