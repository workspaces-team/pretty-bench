import path from "node:path";

import { packageRoot } from "../src/platform.js";
import { render } from "../src/index.js";

const root = packageRoot();
const jobs = [
  ["bar-single-series.json", "bar-single-series.png"],
  ["current-vs-baseline.json", "current-vs-baseline.png"],
  ["history-line.json", "history-line.png"],
  ["minimal-grouped.yaml", "minimal-grouped.png"],
  ["minimal-history.toml", "minimal-history.png"]
];

for (const [inputName, outputName] of jobs) {
  const input = path.join(root, "examples", "specs", inputName);
  const output = path.join(root, "examples", "output", outputName);
  await render({ input, output });
  process.stdout.write(`Rendered ${output}\n`);
}
