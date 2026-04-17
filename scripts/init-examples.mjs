import path from "node:path";

import { init } from "../src/index.js";
import { packageRoot } from "../src/platform.js";

const root = packageRoot();
const startersRoot = path.join(root, "examples", "starters");

await init({
  output: path.join(startersRoot, "grouped-bar.yaml"),
  type: "grouped-bar",
  format: "yaml",
  force: true
});

await init({
  output: path.join(startersRoot, "line.toml"),
  type: "line",
  format: "toml",
  force: true
});
