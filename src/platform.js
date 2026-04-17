import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

const PLATFORM_TAGS = {
  "darwin-arm64": "darwin-arm64",
  "darwin-x64": "darwin-x64",
  "linux-arm64": "linux-arm64",
  "linux-x64": "linux-x64",
  "win32-arm64": "win32-arm64",
  "win32-x64": "win32-x64"
};

export function packageRoot() {
  return PACKAGE_ROOT;
}

export function platformTag(platform = process.platform, arch = process.arch) {
  const key = `${platform}-${arch}`;
  const tag = PLATFORM_TAGS[key];
  if (!tag) {
    throw new Error(`Unsupported platform for pretty-bench: ${key}`);
  }
  return tag;
}

export function nativeAddonName() {
  return "pretty-bench.node";
}

export function nativeOutputPath(root = packageRoot(), tag = platformTag()) {
  return path.join(root, "native", tag, nativeAddonName());
}

export function localNativeCandidates(root = packageRoot()) {
  return [nativeOutputPath(root, platformTag())];
}

export function cargoLibraryFileName(platform = process.platform) {
  if (platform === "win32") {
    return "pretty_bench_native.dll";
  }
  if (platform === "darwin") {
    return "libpretty_bench_native.dylib";
  }
  return "libpretty_bench_native.so";
}
