# Config Formats

`pretty-bench` treats the chart spec file as the core input surface.

Supported formats:

- JSON
- YAML
- TOML

All three map to the same v1 schema and rendering model.

## Recommendation

Use:

- YAML for hand-written repo configs
- JSON for generated specs from benchmark scripts
- TOML when a repo already prefers TOML for checked-in configuration

## Minimal YAML

```yaml
version: 1
type: "grouped-bar"
title: "Minimal YAML benchmark"
labels:
  - "run-1"
  - "run-2"
series:
  - name: "main"
    values: [1200, 1180]
  - name: "branch"
    values: [1350, 1340]
```

## Minimal TOML

```toml
version = 1
type = "line"
title = "History"
labels = ["run-1", "run-2", "run-3"]

[[series]]
name = "main"
values = [1200, 1210, 1230]
```

## Determinism

The config file should be the single source of truth for:

- labels
- series order
- colors
- titles
- optional dimensions

That keeps PNG regeneration deterministic in CI.
