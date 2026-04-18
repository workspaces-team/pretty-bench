# pretty-bench

> Render benchmark charts to PNG. No browser, no JS deps.

<img src="./assets/bench-hero.jpg" alt="Bench hero" width="980" />

## Install

```bash
npm install -D pretty-bench
```

## Quick Start

```bash
cat > bench.yaml <<'EOF'
version: 1
type: grouped-bar
title: JSON parse
labels: [run-1, run-2, run-3]
series:
  - { name: main, values: [1200, 1180, 1215] }
  - { name: branch, values: [1350, 1340, 1362] }
EOF

npx pretty-bench render bench.yaml bench.png
```

Supports JSON, YAML, and TOML. Chart types: `bar`, `grouped-bar`, `line`.

## CLI

```text
pretty-bench render <input> <output>
pretty-bench validate <input>
pretty-bench init <output> [--type grouped-bar]
```

```bash
pretty-bench validate bench.yaml
pretty-bench render bench.yaml bench.png
pretty-bench init benchmarks/example.yaml --type line
```

## Node API

```js
import { render, validate } from "pretty-bench";

await validate("bench.yaml");
await render("bench.yaml", "bench.png");
```

## Spec

```yaml
version: 1
type: grouped-bar
title: JSON parse
subtitle: main vs branch
unit: ops/sec
labels: [run-1, run-2, run-3]
series:
  - name: main
    values: [1200, 1180, 1215]
  - name: branch
    values: [1350, 1340, 1362]
```

Optional fields:

- `subtitle`
- `unit`
- `width`
- `height`
- `series[].color`
- `yAxis.min`
- `yAxis.max`

Full schema: [`schemas/pretty-bench-v1.schema.json`](./schemas/pretty-bench-v1.schema.json).

Starter specs:

- `pretty-bench init bench.json`
- `pretty-bench init bench.yaml --type grouped-bar`
- `pretty-bench init bench.toml --type line`

## CI

```yaml
- run: npx pretty-bench render bench.yaml bench.png
- run: git diff --exit-code bench.png
```

## Contributing

Build, packaging, and publishing notes live in [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT
