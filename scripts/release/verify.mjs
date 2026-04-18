import fs from "node:fs";
import path from "node:path";

import { nativeOutputPath, packageRoot, platformTag } from "../../src/platform.js";

const root = packageRoot();
const releasePlan = JSON.parse(
  fs.readFileSync(path.join(root, "scripts", "release", "plan.json"), "utf8")
);
const requireAll =
  process.argv.includes("--require-all") ||
  process.env.PRETTY_BENCH_REQUIRE_ALL_BINARIES === "1";
const requiredTags = requireAll ? releasePlan.map((entry) => entry.platformTag) : [platformTag()];
const failures = [];

for (const tag of requiredTags) {
  const candidate = nativeOutputPath(root, tag);
  if (!fs.existsSync(candidate)) {
    failures.push(`missing native addon for ${tag}: ${candidate}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Release verification failed:\n- ${failures.join("\n- ")}`);
}

process.stdout.write(`Release verification passed for ${requiredTags.join(", ")}\n`);
