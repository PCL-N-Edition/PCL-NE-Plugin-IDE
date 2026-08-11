# Community Edition M1 end-to-end: Public PNPSDK restore -> build -> sign -> package -> validate.
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $repoRoot 'fixtures\hello-pcl'
$project = Join-Path $fixture 'HelloPcl.csproj'
$verifyDir = Join-Path $fixture '.m1-verify-windows'

if (-not (Test-Path -LiteralPath $project)) {
	throw "Missing Hello PCL fixture: $project"
}

Push-Location $fixture
try {
	& dotnet restore $project
	if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed with exit $LASTEXITCODE" }

	& dotnet build $project -c Release --no-restore
	if ($LASTEXITCODE -ne 0) { throw "dotnet build failed with exit $LASTEXITCODE" }

	$package = Get-ChildItem -LiteralPath (Join-Path $fixture 'bin\Release\net10.0') -Filter '*.pnp' -File |
		Sort-Object LastWriteTimeUtc -Descending |
		Select-Object -First 1
	if (-not $package) {
		throw 'Public PNPSDK did not produce a .pnp package.'
	}

	if (Test-Path -LiteralPath $verifyDir) {
		Remove-Item -LiteralPath $verifyDir -Recurse -Force
	}
	[System.IO.Compression.ZipFile]::ExtractToDirectory($package.FullName, $verifyDir)

	$required = @(
		'plugin.json',
		'META-INF\pnp.files.json',
		'META-INF\pnp.signed.json',
		'lib\net10.0\HelloPcl.dll'
	)
	foreach ($relative in $required) {
		if (-not (Test-Path -LiteralPath (Join-Path $verifyDir $relative))) {
			throw "Package is missing required entry: $relative"
		}
	}
	if (-not (Get-ChildItem -LiteralPath (Join-Path $verifyDir 'META-INF\keys') -Filter '*.asc' -File)) {
		throw 'Package is missing its development public key.'
	}
	if (-not (Get-ChildItem -LiteralPath (Join-Path $verifyDir 'META-INF\signatures') -Filter '*.asc' -File)) {
		throw 'Package is missing its OpenPGP signature.'
	}

	$forbidden = @('Ultimate', 'TeamsEdition', 'DeveloperEdition', 'PRIVATE_API', 'BEGIN RSA PRIVATE KEY', 'BEGIN PGP PRIVATE KEY')
	Get-ChildItem -LiteralPath $verifyDir -Recurse -File | ForEach-Object {
		if ($_.Extension -notin @('.json', '.txt', '.md', '.axaml', '.asc')) { return }
		$content = Get-Content -LiteralPath $_.FullName -Raw -ErrorAction SilentlyContinue
		foreach ($token in $forbidden) {
			if ($content -and $content.Contains($token, [StringComparison]::OrdinalIgnoreCase)) {
				throw "Forbidden token '$token' found in $($_.FullName)"
			}
		}
	}
	Write-Host "M1 e2e passed: $($package.FullName)"
}
finally {
	Pop-Location
	if (Test-Path -LiteralPath $verifyDir) {
		Remove-Item -LiteralPath $verifyDir -Recurse -Force
	}
}
