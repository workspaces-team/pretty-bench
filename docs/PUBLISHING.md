# Publishing To npm

The npm package name is:

- `@workspaces-team/pretty-bench`

The repository name stays `pretty-bench`.

## Goal

Publish one scoped public npm package:

- package: `@workspaces-team/pretty-bench`
- preferred direct-run usage: `npx @workspaces-team/pretty-bench ...`

The installed CLI command is:

- `pretty-bench`

## Publish Requirements

Before publishing:

1. build renderer binaries for every supported platform in `scripts/release-plan.json`
2. assemble them into `native/<platform-tag>/`
3. verify the release package contains all required native addons
4. run tests
5. run `npm publish --access public --provenance`

## Local Publish Checklist

```bash
npm install
npm run build:renderer:debug
npm test
npm run test:renderer
npm run render:examples
npm run release:verify
npm pack --dry-run
```

For a full publish candidate with all native addons assembled:

```bash
node ./scripts/assemble-release-native.mjs ./.release-artifacts
PRETTY_BENCH_REQUIRE_ALL_BINARIES=1 npm run release:verify
npm pack --dry-run
```

## GitHub Actions Publish Flow

The release workflow is intended to:

1. build one native addon artifact per platform
2. upload those artifacts
3. download and assemble them in a publish job
4. verify the release package
5. publish `@workspaces-team/pretty-bench` to npm

Required secret:

- `NPM_TOKEN`

Initial publish target set:

- `darwin-arm64`
- `linux-x64`
- `win32-x64`

## Naming Notes

- npm package: `@workspaces-team/pretty-bench`
- repo: `pretty-bench`
- installed command: `pretty-bench`
- main recommended one-shot command: `npx @workspaces-team/pretty-bench render ...`
- Node bridge: `napi-rs`
- npm runtime dependency count: `0`
