import fs from "node:fs";
import path from "node:path";

import { cargoLibraryFileName, nativeOutputPath, packageRoot, platformTag } from "../src/platform.js";

const root = packageRoot();
const release = process.argv.includes("--release");
const targetDir = release ? "release" : "debug";
const sourceIndex = process.argv.indexOf("--source");
const sourceBinary = sourceIndex >= 0
  ? path.resolve(process.argv[sourceIndex + 1])
  : path.join(root, "renderer", "target", targetDir, cargoLibraryFileName());

if (!fs.existsSync(sourceBinary)) {
  throw new Error(
    `No local native addon was found at ${sourceBinary}. Build it first with node ./scripts/build-renderer.mjs${release ? " --release" : ""}.`
  );
}

const outputPath = nativeOutputPath(root, platformTag());
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.copyFileSync(sourceBinary, outputPath);
if (process.platform !== "win32") {
  fs.chmodSync(outputPath, 0o755);
}

process.stdout.write(`Prepared native addon ${sourceBinary} -> ${outputPath}\n`);
