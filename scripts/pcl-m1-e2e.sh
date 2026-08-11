#!/usr/bin/env bash
# Community Edition M1 end-to-end: Public PNPSDK restore -> build -> sign -> package -> validate.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="$ROOT/fixtures/hello-pcl"
WORK_DIR="$FIXTURE/.m1-verify-linux"
PROJECT_DIR="$WORK_DIR/project"
PACKAGES_DIR="$WORK_DIR/packages"
EXTRACT_DIR="$WORK_DIR/extract"
ARTIFACT_DIR="$FIXTURE/bin/Release/net10.0"

rm -rf "$WORK_DIR"
mkdir -p "$PROJECT_DIR"
trap 'rm -rf "$WORK_DIR"' EXIT

cp "$FIXTURE/HelloPcl.csproj" "$FIXTURE/HelloPcl.slnx" "$FIXTURE/HelloPcl.nplug" \
	"$FIXTURE/plugin.json" "$FIXTURE/nuget.config" "$FIXTURE/README.md" "$PROJECT_DIR/"
cp -R "$FIXTURE/src" "$FIXTURE/locales" "$FIXTURE/ui" "$PROJECT_DIR/"

dotnet restore "$PROJECT_DIR/HelloPcl.csproj" -p:RestorePackagesPath="$PACKAGES_DIR"
dotnet build "$PROJECT_DIR/HelloPcl.csproj" -c Release --no-restore -p:RestorePackagesPath="$PACKAGES_DIR"

BUILT_PACKAGE="$(find "$PROJECT_DIR/bin/Release/net10.0" -maxdepth 1 -type f -name '*.pnp' -print -quit)"
if [[ -z "$BUILT_PACKAGE" ]]; then
	echo "Public PNPSDK did not produce a .pnp package." >&2
	exit 1
fi
mkdir -p "$ARTIFACT_DIR"
PACKAGE="$ARTIFACT_DIR/$(basename "$BUILT_PACKAGE")"
cp "$BUILT_PACKAGE" "$PACKAGE"

mkdir -p "$EXTRACT_DIR"
python3 -m zipfile -e "$PACKAGE" "$EXTRACT_DIR"

for required in \
	plugin.json \
	META-INF/pnp.files.json \
	META-INF/pnp.signed.json \
	lib/net10.0/HelloPcl.dll; do
	if [[ ! -f "$EXTRACT_DIR/$required" ]]; then
		echo "Package is missing required entry: $required" >&2
		exit 1
	fi
done

find "$EXTRACT_DIR/META-INF/keys" -maxdepth 1 -type f -name '*.asc' -print -quit | grep -q .
find "$EXTRACT_DIR/META-INF/signatures" -maxdepth 1 -type f -name '*.asc' -print -quit | grep -q .

if grep -aR -E 'Ultimate|TeamsEdition|DeveloperEdition|PRIVATE_API|BEGIN (RSA|PGP) PRIVATE KEY' "$EXTRACT_DIR" >/dev/null 2>&1; then
	echo "Forbidden private markers found in package contents." >&2
	exit 1
fi

echo "M1 e2e passed: $PACKAGE"
