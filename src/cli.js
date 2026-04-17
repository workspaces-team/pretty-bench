import fs from "node:fs";
import process from "node:process";

import { createTemplate, init, render, validate } from "./index.js";

function printHelp() {
  process.stdout.write(
    [
      "pretty-bench",
      "",
      "Usage:",
      "  pretty-bench render --input <spec.json|yaml|toml> --output <chart.png>",
      "  pretty-bench validate --input <spec.json|yaml|toml>",
      "  pretty-bench init --output <spec.json|yaml|toml> [--type <bar|grouped-bar|line>] [--format <json|yaml|toml>]",
      "",
      "Examples:",
      "  npx @workspaces-team/pretty-bench render --input bench.yaml --output bench.png",
      "  npx @workspaces-team/pretty-bench validate --input bench.toml",
      "  npx @workspaces-team/pretty-bench init --output benchmarks/example.yaml --type grouped-bar",
      ""
    ].join("\n")
  );
}

function parseOptions(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const token = argumentsList[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
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
    const options = parseOptions(rest);
    const outputPath = await render({ input: options.input, output: options.output });
    process.stdout.write(`Rendered ${outputPath}\n`);
    return;
  }

  if (command === "validate") {
    const options = parseOptions(rest);
    const message = await validate({ input: options.input });
    process.stdout.write(`${message || "Spec is valid"}\n`);
    return;
  }

  if (command === "init") {
    const options = parseOptions(rest);
    const outputPath = await init({ output: options.output, type: options.type, format: options.format });
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
