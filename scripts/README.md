# Development tooling

Run `npm run build -- essential` from the repository root. The wrapper checks Node and Zeus versions, builds the selected watchface and extracts the explicit device ZIP using Python's standard library. It never publishes.

`package-watchface.py` validates bundle target metadata, app identity, version and required device resources before writing the local installation ZIP.
