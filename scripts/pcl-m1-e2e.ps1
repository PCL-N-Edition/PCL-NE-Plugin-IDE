# Community Edition M1 end-to-end: fixture create-path simulation via existing fixture + CLI.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $root 'fixtures\hello-pcl'
$cli = Join-Path $root 'tools\pnp-community-cli\bin\pnp.js'

if (-not (Test-Path $cli)) {
	throw "Missing Community pnp CLI at $cli"
}
if (-not (Test-Path (Join-Path $fixture 'plugin.manifest.json'))) {
	throw "Missing Hello PCL fixture at $fixture"
}

Write-Host "==> pnp --version"
& node $cli --version

Push-Location $fixture
try {
	if (Test-Path 'dist') {
		Remove-Item -Recurse -Force 'dist'
	}

	Write-Host "==> build"
	& node $cli build
	if ($LASTEXITCODE -ne 0) { throw "build failed with exit $LASTEXITCODE" }

	Write-Host "==> sign"
	& node $cli sign
	if ($LASTEXITCODE -ne 0) { throw "sign failed with exit $LASTEXITCODE" }

	Write-Host "==> package"
	& node $cli package
	if ($LASTEXITCODE -ne 0) { throw "package failed with exit $LASTEXITCODE" }

	Write-Host "==> validate"
	& node $cli validate
	if ($LASTEXITCODE -ne 0) { throw "validate failed with exit $LASTEXITCODE" }

	$package = Join-Path $fixture 'dist\com.pcln.hello-pcl-0.1.0.pnp'
	if (-not (Test-Path $package)) {
		throw "Expected package not found: $package"
	}

	# Community boundary scan: no private module markers in package contents
	$packageDir = Join-Path $fixture 'dist\com.pcln.hello-pcl-0.1.0'
	$forbidden = @('Ultimate', 'TeamsEdition', 'DeveloperEdition', 'PRIVATE_API', 'BEGIN RSA PRIVATE KEY')
	Get-ChildItem -Recurse -File $packageDir | ForEach-Object {
		$content = Get-Content -Raw -ErrorAction SilentlyContinue $_.FullName
		if (-not $content) { return }
		foreach ($token in $forbidden) {
			if ($content -match [regex]::Escape($token)) {
				throw "Forbidden token '$token' found in $($_.FullName)"
			}
		}
	}

	Write-Host "M1 e2e passed: $package"
}
finally {
	Pop-Location
}
