# Contributing

`pretty-bench` is a small wrapper around the Rust renderer in [`renderer/`](./renderer/).

## Local Development

```bash
npm install
node ./scripts/build-renderer.mjs
npm test
```

The local build copies the compiled addon into `native/<platform-tag>/pretty-bench.node`.

## Examples

```bash
node ./scripts/init-examples.mjs
node ./scripts/build-renderer.mjs
node ./scripts/render-examples.mjs
```

## Native Packaging

The package resolves native addons in this order:

1. `PRETTY_BENCH_BINDING`
2. `native/<platform-tag>/pretty-bench.node`

Release assembly and verification scripts live under [`scripts/release/`](./scripts/release/).
They stay out of npm scripts on purpose.

## Publishing

Before publishing:

1. Build native addons for each platform in [`scripts/release/plan.json`](./scripts/release/plan.json).
2. Assemble artifacts with `node ./scripts/release/assemble.mjs`.
3. Verify the package with `node ./scripts/release/verify.mjs`.
4. Run `npm test`.
5. Check `npm pack --dry-run`.
6. Publish with `npm publish --access public --provenance`.
