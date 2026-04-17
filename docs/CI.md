# CI Patterns

`pretty-bench` is designed for checked-in PNG artifacts.

## Basic Pattern

1. generate benchmark results
2. write or update a chart spec file
3. run `pretty-bench render`
4. fail CI if generated artifacts are stale

## npx Example

```bash
npx @workspaces-team/pretty-bench render --input benchmarks/current-vs-baseline.yaml --output benchmarks/current-vs-baseline.png
```

That is the main developer-experience target:

- no local Rust install
- no browser runtime
- no chart library setup
- no JS runtime dependency tree beyond the package itself

## GitHub Actions

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20

- run: npm ci

- run: npx @workspaces-team/pretty-bench validate --input benchmarks/current-vs-baseline.yaml
- run: npx @workspaces-team/pretty-bench render --input benchmarks/current-vs-baseline.yaml --output benchmarks/current-vs-baseline.png
- run: git diff --exit-code
```

## pnpm Workspace

```bash
pnpm --filter service-a exec pretty-bench render \
  --input ../../benchmarks/service-a-history.toml \
  --output ../../benchmarks/service-a-history.png
```
