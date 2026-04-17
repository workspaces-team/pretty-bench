# Demo Patterns

This repo includes demos that show how little configuration is needed.

## JSON Comparison

- input: `examples/specs/current-vs-baseline.json`
- output: `examples/output/current-vs-baseline.png`

## YAML Minimal Grouped Bar

- input: `examples/specs/minimal-grouped.yaml`
- output: `examples/output/minimal-grouped.png`

## TOML Minimal History

- input: `examples/specs/minimal-history.toml`
- output: `examples/output/minimal-history.png`

## Regenerate Everything

```bash
npm run build:renderer:debug
npm run render:examples
```
