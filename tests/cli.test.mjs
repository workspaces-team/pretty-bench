import { before, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { render, validate } from "../src/index.js";
import { runCli } from "../src/cli.js";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const BUILD_SCRIPT = path.join(ROOT, "scripts", "build-renderer.mjs");
const VALID_SPEC = path.join(ROOT, "examples", "specs", "current-vs-baseline.json");
const VALID_YAML_SPEC = path.join(ROOT, "examples", "specs", "minimal-grouped.yaml");
const VALID_TOML_SPEC = path.join(ROOT, "examples", "specs", "minimal-history.toml");
const INVALID_SPEC = path.join(ROOT, "tests", "fixtures", "invalid-missing-series.json");

before(() => {
  spawnSync(process.execPath, [path.join(ROOT, "scripts", "init-examples.mjs")], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const result = spawnSync(process.execPath, [BUILD_SCRIPT], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

describe("pretty-bench CLI wrapper", () => {
  test("creates starter specs", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pretty-bench-init-"));
    const outputPath = path.join(tempDir, "chart.json");
    await runCli(["init", outputPath, "--type", "line"]);
    const payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    assert.equal(payload.type, "line");
    assert.deepEqual(payload.labels, ["run-101", "run-102", "run-103", "run-104"]);
  });

  test("creates yaml starter specs", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pretty-bench-init-yaml-"));
    const outputPath = path.join(tempDir, "chart.yaml");
    await runCli(["init", outputPath, "--type", "grouped-bar"]);
    const text = fs.readFileSync(outputPath, "utf8");

    assert.match(text, /type: "grouped-bar"/);
    assert.match(text, /series:/);
  });

  test("creates toml starter specs", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pretty-bench-init-toml-"));
    const outputPath = path.join(tempDir, "chart.toml");
    await runCli(["init", outputPath, "--type", "line"]);
    const text = fs.readFileSync(outputPath, "utf8");

    assert.match(text, /type = "line"/);
    assert.match(text, /\[\[series\]\]/);
  });

  test("validates a good spec", async () => {
    await validate(VALID_SPEC);
  });

  test("validates a good yaml spec", async () => {
    await validate(VALID_YAML_SPEC);
  });

  test("validates a good toml spec", async () => {
    await validate(VALID_TOML_SPEC);
  });

  test("fails clearly on an invalid spec", async () => {
    await assert.rejects(() => validate(INVALID_SPEC), /series/i);
  });

  test("renders a png file", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pretty-bench-render-"));
    const outputPath = path.join(tempDir, "chart.png");
    await render(VALID_SPEC, outputPath);

    assert.equal(fs.existsSync(outputPath), true);
    assert.ok(fs.statSync(outputPath).size > 0);
  });
});
