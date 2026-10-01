# Development tooling

Run `npm run build -- essential` or `npm run build -- matrix` from the repository root. The wrapper checks Node and Zeus versions, builds the selected watchface and extracts the explicit device ZIPs in `dist/install` using Python's standard library. It never publishes.

`package-watchface.py` validates bundle targets against the selected watchface's checked-in round 480 × 480 catalog, app identity, version and required device resources before writing the local installation ZIP.
