import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const releasePlan = JSON.parse(fs.readFileSync(path.join(ROOT, "release", "plan.json"), "utf8"));

process.stdout.write(`${JSON.stringify(releasePlan, null, 2)}\n`);
