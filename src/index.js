import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { localNativeCandidates, nativeOutputPath, packageRoot, platformTag } from "./platform.js";

const require = createRequire(import.meta.url);

function ensureFileReadable(filePath) {
  fs.accessSync(filePath, fs.constants.R_OK);
  return filePath;
}

function isExecutable(filePath) {
  try {
    ensureFileReadable(filePath);
    return true;
  } catch {
    return false;
  }
}

function loadNativeBinding(options = {}) {
  const bindingPath = resolveNativeBindingPath(options);
  return require(bindingPath);
}

export function resolveNativeBindingPath(options = {}) {
  if (options.bindingPath || options.binaryPath) {
    return path.resolve(String(options.bindingPath ?? options.binaryPath));
  }

  if (process.env.PRETTY_BENCH_BINDING) {
    return path.resolve(process.env.PRETTY_BENCH_BINDING);
  }

  for (const candidate of localNativeCandidates()) {
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  const packaged = nativeOutputPath();
  if (isExecutable(packaged)) {
    return packaged;
  }

  throw new Error(
    [
      `No pretty-bench native binding was found for ${platformTag()}.`,
      `Expected a packaged native addon at ${nativeOutputPath()}.`,
      `For local repo development, run: npm run build:renderer:debug`,
      `Published releases are expected to include a prebuilt napi-rs addon, so end users should not need Rust.`,
      `This npm package keeps zero JS runtime dependencies; the Rust addon is shipped directly in the package.`
    ].join("\n")
  );
}

export function createTemplate(type = "grouped-bar") {
  if (type === "bar") {
    return {
      version: 1,
      type: "bar",
      title: "Single implementation benchmark",
      subtitle: "latest local run",
      unit: "ms",
      labels: ["parse", "transform", "serialize"],
      series: [{ name: "current", values: [12.4, 18.1, 9.8] }]
    };
  }

  if (type === "line") {
    return {
      version: 1,
      type: "line",
      title: "Benchmark history",
      subtitle: "ops/sec over recent runs",
      unit: "ops/sec",
      labels: ["run-101", "run-102", "run-103", "run-104"],
      series: [
        { name: "main", values: [1200, 1212, 1220, 1235] },
        { name: "branch", values: [1260, 1288, 1290, 1302] }
      ]
    };
  }

  return {
    version: 1,
    type: "grouped-bar",
    title: "Benchmark comparison",
    subtitle: "baseline vs candidate",
    unit: "ops/sec",
    labels: ["run-1", "run-2", "run-3"],
    series: [
      { name: "baseline", values: [1200, 1180, 1215] },
      { name: "candidate", values: [1350, 1340, 1362] }
    ]
  };
}

export function formatFromPath(filePath) {
  const extension = path.extname(String(filePath)).toLowerCase();
  if (extension === ".yaml" || extension === ".yml") {
    return "yaml";
  }
  if (extension === ".toml") {
    return "toml";
  }
  return "json";
}

function yamlScalar(value) {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value == null) {
    return "null";
  }
  return JSON.stringify(String(value));
}

function toYaml(spec) {
  const lines = [
    `version: ${spec.version}`,
    `type: ${JSON.stringify(spec.type)}`,
    `title: ${JSON.stringify(spec.title)}`
  ];
  if (spec.subtitle) lines.push(`subtitle: ${JSON.stringify(spec.subtitle)}`);
  if (spec.unit) lines.push(`unit: ${JSON.stringify(spec.unit)}`);
  if (spec.width) lines.push(`width: ${spec.width}`);
  if (spec.height) lines.push(`height: ${spec.height}`);
  lines.push("labels:");
  for (const label of spec.labels) {
    lines.push(`  - ${JSON.stringify(label)}`);
  }
  lines.push("series:");
  for (const series of spec.series) {
    lines.push(`  - name: ${JSON.stringify(series.name)}`);
    if (series.color) {
      lines.push(`    color: ${JSON.stringify(series.color)}`);
    }
    lines.push("    values:");
    for (const value of series.values) {
      lines.push(`      - ${yamlScalar(value)}`);
    }
  }
  if (spec.yAxis?.min != null || spec.yAxis?.max != null) {
    lines.push("yAxis:");
    if (spec.yAxis.min != null) lines.push(`  min: ${yamlScalar(spec.yAxis.min)}`);
    if (spec.yAxis.max != null) lines.push(`  max: ${yamlScalar(spec.yAxis.max)}`);
  }
  return `${lines.join("\n")}\n`;
}

function toToml(spec) {
  const lines = [
    `version = ${spec.version}`,
    `type = ${JSON.stringify(spec.type)}`,
    `title = ${JSON.stringify(spec.title)}`
  ];
  if (spec.subtitle) lines.push(`subtitle = ${JSON.stringify(spec.subtitle)}`);
  if (spec.unit) lines.push(`unit = ${JSON.stringify(spec.unit)}`);
  if (spec.width) lines.push(`width = ${spec.width}`);
  if (spec.height) lines.push(`height = ${spec.height}`);
  lines.push(`labels = [${spec.labels.map((label) => JSON.stringify(label)).join(", ")}]`);
  if (spec.yAxis?.min != null || spec.yAxis?.max != null) {
    lines.push("");
    lines.push("[yAxis]");
    if (spec.yAxis.min != null) lines.push(`min = ${spec.yAxis.min}`);
    if (spec.yAxis.max != null) lines.push(`max = ${spec.yAxis.max}`);
  }
  for (const series of spec.series) {
    lines.push("");
    lines.push("[[series]]");
    lines.push(`name = ${JSON.stringify(series.name)}`);
    if (series.color) lines.push(`color = ${JSON.stringify(series.color)}`);
    lines.push(`values = [${series.values.join(", ")}]`);
  }
  return `${lines.join("\n")}\n`;
}

export function serializeTemplate(spec, format = "json") {
  if (format === "yaml") {
    return toYaml(spec);
  }
  if (format === "toml") {
    return toToml(spec);
  }
  return `${JSON.stringify(spec, null, 2)}\n`;
}

export async function init(options) {
  if (!options?.output) {
    throw new Error("init requires an output path");
  }
  const outputPath = path.resolve(String(options.output));
  if (fs.existsSync(outputPath) && !options.force) {
    throw new Error(`Refusing to overwrite existing file: ${outputPath}. Pass force=true or delete it first.`);
  }
  const format = options.format || formatFromPath(outputPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serializeTemplate(createTemplate(options.type), format), "utf8");
  return outputPath;
}

export async function validate(options) {
  if (!options?.input) {
    throw new Error("validate requires an input path");
  }
  const inputPath = path.resolve(String(options.input));
  const native = loadNativeBinding(options);
  return native.validateSpec(inputPath);
}

export async function render(options) {
  if (!options?.input || !options?.output) {
    throw new Error("render requires input and output paths");
  }
  const inputPath = path.resolve(String(options.input));
  const outputPath = path.resolve(String(options.output));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const native = loadNativeBinding(options);
  return native.renderSpec(inputPath, outputPath);
}
