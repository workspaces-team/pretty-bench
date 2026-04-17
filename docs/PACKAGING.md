# Packaging Strategy

The npm package is a thin wrapper around a Rust renderer exposed through `napi-rs`.

## Runtime Contract

- main package has no JS charting dependency
- main package has zero JS runtime dependencies
- Rust is compiled into a `.node` native addon
- boundary is file-based and coarse
- Node talks to the renderer through `https://napi.rs/`

## Native Addon Resolution

Resolution order:

1. `PRETTY_BENCH_BINDING`
2. packaged addon in `native/<platform-tag>/pretty-bench.node`
3. local build copied into that same location during repo development

## Release Direction

V1 is structured for prebuilt native addon shipping.

What is present now:

- packaged native addon directory structure
- release workflow scaffold
- native addon preparation script
- initial publish target set: `darwin-arm64`, `linux-x64`, `win32-x64`

What still needs fuller release work:

- extending publish coverage beyond the initial target set if needed
- signing or provenance hardening if desired
- deciding whether to ship a single fat npm package or split by platform package

End-user goal remains unchanged:

- `npx @workspaces-team/pretty-bench ...`
- no Rust install required
- no JS runtime dependencies required
- no JS charting dependency required

Publishing details live in `docs/PUBLISHING.md`.
