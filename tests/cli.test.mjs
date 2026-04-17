import { before, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { createTemplate, init, render, validate } from "../src/index.js";

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
    const written = await init({ output: outputPath, type: "line" });
    const payload = JSON.parse(fs.readFileSync(written, "utf8"));

    assert.equal(payload.type, "line");
    assert.deepEqual(createTemplate("line").labels, payload.labels);
  });

  test("creates yaml starter specs", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pretty-bench-init-yaml-"));
    const outputPath = path.join(tempDir, "chart.yaml");
    const written = await init({ output: outputPath, type: "grouped-bar" });
    const text = fs.readFileSync(written, "utf8");

    assert.match(text, /type: "grouped-bar"/);
    assert.match(text, /series:/);
  });

  test("creates toml starter specs", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pretty-bench-init-toml-"));
    const outputPath = path.join(tempDir, "chart.toml");
    const written = await init({ output: outputPath, type: "line" });
    const text = fs.readFileSync(written, "utf8");

    assert.match(text, /type = "line"/);
    assert.match(text, /\[\[series\]\]/);
  });

  test("validates a good spec", async () => {
    const message = await validate({ input: VALID_SPEC });
    assert.match(message, /valid/i);
  });

  test("validates a good yaml spec", async () => {
    const message = await validate({ input: VALID_YAML_SPEC });
    assert.match(message, /valid/i);
  });

  test("validates a good toml spec", async () => {
    const message = await validate({ input: VALID_TOML_SPEC });
    assert.match(message, /valid/i);
  });

  test("fails clearly on an invalid spec", async () => {
    await assert.rejects(() => validate({ input: INVALID_SPEC }), /series/i);
  });

  test("renders a png file", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pretty-bench-render-"));
    const outputPath = path.join(tempDir, "chart.png");
    await render({ input: VALID_SPEC, output: outputPath });

    assert.equal(fs.existsSync(outputPath), true);
    assert.ok(fs.statSync(outputPath).size > 0);
  });
});
