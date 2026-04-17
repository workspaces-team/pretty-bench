import { spawnSync } from "node:child_process";
import path from "node:path";

import { cargoLibraryFileName } from "../src/platform.js";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const manifestPath = path.join(ROOT, "renderer", "Cargo.toml");
const release = process.argv.includes("--release");
const cargoArgs = ["build", "--manifest-path", manifestPath];

if (release) {
  cargoArgs.push("--release");
}

const result = spawnSync("cargo", cargoArgs, {
  cwd: ROOT,
  stdio: "inherit"
});

if (result.error) {
  throw result.error;
}

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

const prepareScript = path.join(ROOT, "scripts", "prepare-native.mjs");
const prepareArgs = [prepareScript];
if (release) {
  prepareArgs.push("--release");
}
prepareArgs.push("--source");
prepareArgs.push(path.join(ROOT, "renderer", "target", release ? "release" : "debug", cargoLibraryFileName()));
const prepare = spawnSync(process.execPath, prepareArgs, {
  cwd: ROOT,
  stdio: "inherit"
});

if (prepare.error) {
  throw prepare.error;
}

process.exit(prepare.status ?? 1);
