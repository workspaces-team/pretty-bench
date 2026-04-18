import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { render, validate } from "./index.js";

function createTemplate(type = "grouped-bar") {
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

function formatFromPath(filePath) {
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

function serializeTemplate(spec, format = "json") {
  if (format === "yaml") {
    return toYaml(spec);
  }
  if (format === "toml") {
    return toToml(spec);
  }
  return `${JSON.stringify(spec, null, 2)}\n`;
}

function writeStarter(output, options = {}) {
  if (!output) {
    throw new Error("init requires an output path");
  }
  const outputPath = path.resolve(String(output));
  if (fs.existsSync(outputPath) && !options.force) {
    throw new Error(`Refusing to overwrite existing file: ${outputPath}. Pass --force or delete it first.`);
  }
  const format = options.format || formatFromPath(outputPath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serializeTemplate(createTemplate(options.type), format), "utf8");
  return outputPath;
}

function printHelp() {
  process.stdout.write(
    [
      "pretty-bench",
      "",
      "Usage:",
      "  pretty-bench render <input> <output>",
      "  pretty-bench validate <input>",
      "  pretty-bench init <output> [--type <bar|grouped-bar|line>] [--format <json|yaml|toml>] [--force]",
      "",
      "Examples:",
      "  npx pretty-bench render bench.yaml bench.png",
      "  npx pretty-bench validate bench.toml",
      "  npx pretty-bench init benchmarks/example.yaml --type grouped-bar",
      ""
    ].join("\n")
  );
}

function parseFlags(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const token = argumentsList[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    if (key === "force") {
      options.force = true;
      continue;
    }
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for option ${token}`);
    }
    options[key] = value;
    index += 1;
  }
  return options;
}

export async function runCli(argumentsList) {
  const [command, ...rest] = argumentsList;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    printHelp();
    return;
  }

  if (command === "render") {
    if (rest.length !== 2) {
      throw new Error("render requires <input> and <output>");
    }
    const [input, output] = rest;
    await render(input, output);
    process.stdout.write(`Rendered ${path.resolve(String(output))}\n`);
    return;
  }

  if (command === "validate") {
    if (rest.length !== 1) {
      throw new Error("validate requires <input>");
    }
    await validate(rest[0]);
    process.stdout.write("Spec is valid\n");
    return;
  }

  if (command === "init") {
    const [output, ...flagArgs] = rest;
    const options = parseFlags(flagArgs);
    const outputPath = writeStarter(output, options);
    process.stdout.write(`Wrote ${outputPath}\n`);
    process.stdout.write(fs.readFileSync(outputPath, "utf8"));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
