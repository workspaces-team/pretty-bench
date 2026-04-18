import path from "node:path";

import { runCli } from "../src/cli.js";
import { packageRoot } from "../src/platform.js";

const root = packageRoot();
const startersRoot = path.join(root, "examples", "starters");

await runCli(["init", path.join(startersRoot, "grouped-bar.yaml"), "--type", "grouped-bar", "--format", "yaml", "--force"]);
await runCli(["init", path.join(startersRoot, "line.toml"), "--type", "line", "--format", "toml", "--force"]);
