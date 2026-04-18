import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { localNativeCandidates, nativeOutputPath, platformTag } from "./platform.js";

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

function resolveNativeBindingPath() {
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
      "For local repo development, run: node ./scripts/build-renderer.mjs",
      "Published releases are expected to include a prebuilt napi-rs addon."
    ].join("\n")
  );
}

function loadNativeBinding() {
  const bindingPath = resolveNativeBindingPath();
  return require(bindingPath);
}

export async function validate(input) {
  if (!input) {
    throw new Error("validate requires an input path");
  }
  const inputPath = path.resolve(String(input));
  const native = loadNativeBinding();
  await native.validateSpec(inputPath);
}

export async function render(input, output) {
  if (!input || !output) {
    throw new Error("render requires input and output paths");
  }
  const inputPath = path.resolve(String(input));
  const outputPath = path.resolve(String(output));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const native = loadNativeBinding();
  await native.renderSpec(inputPath, outputPath);
}
