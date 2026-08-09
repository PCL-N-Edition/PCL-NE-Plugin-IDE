#!/usr/bin/env bash
# Community Edition M1 end-to-end: fixture build → sign → package → validate
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="$ROOT/fixtures/hello-pcl"
CLI="$ROOT/tools/pnp-community-cli/bin/pnp.js"

if [[ ! -f "$CLI" ]]; then
	echo "Missing Community pnp CLI at $CLI" >&2
	exit 1
fi
if [[ ! -f "$FIXTURE/plugin.manifest.json" ]]; then
	echo "Missing Hello PCL fixture at $FIXTURE" >&2
	exit 1
fi

echo "==> pnp --version"
node "$CLI" --version

cd "$FIXTURE"
rm -rf dist

echo "==> build"
node "$CLI" build

echo "==> sign"
node "$CLI" sign

echo "==> package"
node "$CLI" package

echo "==> validate"
node "$CLI" validate

PACKAGE="$FIXTURE/dist/com.pcln.hello-pcl-0.1.0.pnp"
if [[ ! -f "$PACKAGE" ]]; then
	echo "Expected package not found: $PACKAGE" >&2
	exit 1
fi

# Community boundary scan
PACKAGE_DIR="$FIXTURE/dist/com.pcln.hello-pcl-0.1.0"
if grep -R -E 'Ultimate|TeamsEdition|DeveloperEdition|PRIVATE_API|BEGIN RSA PRIVATE KEY' "$PACKAGE_DIR" >/dev/null 2>&1; then
	echo "Forbidden private markers found in package contents" >&2
	exit 1
fi

echo "M1 e2e passed: $PACKAGE"
