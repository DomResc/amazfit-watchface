# Personal Amazfit Watchfaces

A small personal repository for developing Amazfit watchfaces. The first device is Amazfit Balance 2 XT.

## Current status

The first watchface, [Essential](src/watchfaces/essential/README.md), is implemented for Balance 2 XT (`deviceSource: 10486017`). The user confirmed local installation and correct watchface/AOD updates for 0.1.0. The watch selection preview was confirmed correct in 0.1.1, and the user accepted the Gadgetbridge preview correction in 0.1.2. Installation is local through Gadgetbridge; tagged builds can be distributed through automatic GitHub Releases.

- [Development plan](docs/development-plan.md): architecture, milestones and validation.
- [Device evidence](docs/device-validation.md): target information and physical checks.

## Repository layout

```text
src/watchfaces/       Independent watchface projects
scripts/              Explicit build and package tooling
tests/                Host-side behavior and tooling tests
docs/                 Development decisions and device validation
```

Each future watchface owns its `app.js`, `app.json`, `assets/`, `watchface/` and README. Keep rendering layouts separate from behavior when useful. Add shared adapters, utilities or declarations only when required; do not import code from a sibling watchface.

## Development approach

Use JavaScript with JSDoc and strict checking for owned code. Essential implements the approved centered time/date design with Italian and English labels and dedicated AOD. Approve visual previews before substantial design changes.

From the repository root:

```sh
nvm use
npm ci
npm test
npm run test:packaging
npm run typecheck
npm run build -- essential
```

CI runs tests, typecheck and the explicit Essential build; it has not yet run remotely. Use Node 24.19.0 and Zeus CLI 1.9.3. See Essential's README for setup, package output and Gadgetbridge installation.

## License

Original project work is covered by the [MIT license](LICENSE). Record the origin and applicable license of any third-party code, fonts or artwork introduced in future changes.

## Automatic GitHub releases

Pushing a tag such as `essential-v0.1.2` starts the release workflow. The tag version must exactly match `src/watchfaces/essential/app.json`. After tests, typecheck and build succeed, the workflow publishes a GitHub Release with only the validated device ZIP attached. It does not submit anything to the Zepp store.

Create the tag on the committed revision containing the intended manifest, source and workflow, then push that tag. Ordinary branch pushes and pull requests only run validation. Published releases are not overwritten on reruns; an existing release causes publication to fail.

The workflow uses GitHub's automatic token; no personal access token is required. Only the publication job receives write permission. Remote release execution remains unverified until the first tag is pushed.
