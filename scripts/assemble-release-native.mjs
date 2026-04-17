import fs from "node:fs";
import path from "node:path";

import { packageRoot } from "../src/platform.js";

const root = packageRoot();
const artifactsRoot = path.resolve(process.argv[2] ?? path.join(root, ".release-artifacts"));
const nativeRoot = path.join(root, "native");

if (!fs.existsSync(artifactsRoot)) {
  throw new Error(`Release artifacts directory does not exist: ${artifactsRoot}`);
}

const entries = fs.readdirSync(artifactsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
if (entries.length === 0) {
  throw new Error(`No downloaded release artifacts were found under ${artifactsRoot}`);
}

for (const entry of entries) {
  const nativeCandidate = path.join(artifactsRoot, entry.name, "native");
  if (!fs.existsSync(nativeCandidate)) {
    continue;
  }
  for (const platformEntry of fs.readdirSync(nativeCandidate, { withFileTypes: true }).filter((child) => child.isDirectory())) {
    const sourceDir = path.join(nativeCandidate, platformEntry.name);
    const targetDir = path.join(nativeRoot, platformEntry.name);
    fs.mkdirSync(targetDir, { recursive: true });
    for (const fileEntry of fs.readdirSync(sourceDir, { withFileTypes: true }).filter((child) => child.isFile())) {
      fs.copyFileSync(path.join(sourceDir, fileEntry.name), path.join(targetDir, fileEntry.name));
    }
  }
}

process.stdout.write(`Assembled native addons from ${artifactsRoot}\n`);
