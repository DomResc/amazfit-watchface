# Personal Amazfit Watchfaces

A small personal repository for developing Amazfit watchfaces. The first device is Amazfit Balance 2 XT.

## Current status

This repository contains the project structure and development plan, not an installable watchface. Device targeting, SDK selection and the build toolchain remain unverified here.

- [Development plan](docs/development-plan.md): architecture, milestones and validation.
- [Device evidence](docs/device-validation.md): target information and physical checks.

## Repository layout

```text
src/watchfaces/       Independent watchface projects, added after design approval
scripts/              Repository build and asset tooling, added when required
tests/                Host-side behavior and tooling tests
docs/                 Development decisions and device validation
```

Each future watchface owns its `app.js`, `app.json`, `assets/`, `watchface/` and README. Keep rendering layouts separate from behavior when useful. Add shared adapters, utilities or declarations only when required; do not import code from a sibling watchface.

## Development approach

Use JavaScript with JSDoc and strict checking for owned code. Start with time, date and a dedicated AOD presentation. Approve a visual preview before implementing the first design. Establish build, typecheck and tests with pinned tools when adding the first executable watchface.

No build, typecheck or test commands are available yet.

## License

Original project work is covered by the [MIT license](LICENSE). Record the origin and applicable license of any third-party code, fonts or artwork introduced in future changes.
