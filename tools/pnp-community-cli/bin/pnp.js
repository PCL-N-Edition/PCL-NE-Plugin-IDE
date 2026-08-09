#!/usr/bin/env node
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const VERSION = '0.1.0';
const MANIFEST = 'plugin.manifest.json';

function usage() {
	console.log(`pnp (Community) ${VERSION}
Usage:
  pnp --version
  pnp build
  pnp package
  pnp validate
  pnp sign

Runs in the current working directory (must contain plugin.manifest.json).`);
}

function fail(message, code = 1) {
	console.error(message);
	process.exit(code);
}

function readManifest(root) {
	const manifestPath = path.join(root, MANIFEST);
	if (!fs.existsSync(manifestPath)) {
		fail(`Missing ${MANIFEST} in ${root}`);
	}
	try {
		return { manifestPath, manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')) };
	} catch (error) {
		fail(`Invalid JSON in ${MANIFEST}: ${error.message}`);
	}
}

function validateManifest(manifest, manifestPath) {
	const required = ['schemaVersion', 'id', 'name', 'version', 'sdkVersion', 'entry'];
	for (const key of required) {
		if (manifest[key] === undefined || manifest[key] === null || manifest[key] === '') {
			console.log(`${path.basename(manifestPath)}(1,1): error PCL0001: Missing required field '${key}'`);
			return false;
		}
	}
	if (manifest.schemaVersion !== '1.0') {
		console.log(`${path.basename(manifestPath)}(1,1): error PCL0002: Unsupported schemaVersion '${manifest.schemaVersion}'`);
		return false;
	}
	if (!/^[a-z0-9]+(\.[a-z0-9\-]+)+$/.test(manifest.id)) {
		console.log(`${path.basename(manifestPath)}(1,1): error PCL0003: Invalid plugin id '${manifest.id}'`);
		return false;
	}
	if (!manifest.entry?.assembly || !manifest.entry?.type) {
		console.log(`${path.basename(manifestPath)}(1,1): error PCL0004: entry.assembly and entry.type are required`);
		return false;
	}
	return true;
}

function runDotnetBuild(root) {
	const csproj = fs.readdirSync(root).find(name => name.endsWith('.csproj'));
	if (!csproj) {
		console.log('No .csproj found; skipping dotnet build (manifest-only package mode).');
		return true;
	}
	const result = spawnSync('dotnet', ['build', csproj, '-c', 'Release'], {
		cwd: root,
		encoding: 'utf8',
		shell: process.platform === 'win32',
	});
	if (result.stdout) {
		process.stdout.write(result.stdout);
	}
	if (result.stderr) {
		process.stderr.write(result.stderr);
	}
	if (result.status !== 0) {
		console.log(`${csproj}(1,1): error PCL0100: dotnet build failed with exit code ${result.status}`);
		return false;
	}
	return true;
}

function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
	ensureDir(path.dirname(dest));
	fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
	if (!fs.existsSync(src)) {
		return;
	}
	ensureDir(dest);
	for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
		const from = path.join(src, entry.name);
		const to = path.join(dest, entry.name);
		if (entry.isDirectory()) {
			copyDir(from, to);
		} else {
			copyFile(from, to);
		}
	}
}

function packagePlugin(root, manifest) {
	const outDir = path.join(root, 'dist');
	const stageDir = path.join(outDir, 'stage');
	const packageName = `${manifest.id}-${manifest.version}.pnp`;
	const packageDir = path.join(outDir, packageName.replace(/\.pnp$/, ''));

	fs.rmSync(stageDir, { recursive: true, force: true });
	fs.rmSync(packageDir, { recursive: true, force: true });
	ensureDir(stageDir);

	copyFile(path.join(root, MANIFEST), path.join(stageDir, MANIFEST));

	const assemblyRel = manifest.entry.assembly.replace(/\\/g, '/');
	const assemblySrc = path.join(root, assemblyRel);
	if (fs.existsSync(assemblySrc)) {
		copyFile(assemblySrc, path.join(stageDir, assemblyRel));
	} else {
		// Development placeholder when full .NET build output is not present.
		const placeholder = path.join(stageDir, assemblyRel);
		ensureDir(path.dirname(placeholder));
		fs.writeFileSync(placeholder, `PCL-N community stub assembly for ${manifest.id}\n`, 'utf8');
		console.log(`${MANIFEST}(1,1): warning PCL0201: Assembly '${assemblyRel}' not found; wrote development stub.`);
	}

	// Optional content folders
	for (const folder of ['assets', 'l10n', 'themes']) {
		copyDir(path.join(root, folder), path.join(stageDir, folder));
	}

	// Materialize as a directory package with .pnp marker (zip-compatible layout later).
	copyDir(stageDir, packageDir);
	const signaturePath = path.join(root, 'dist', 'development.sig.json');
	if (fs.existsSync(signaturePath)) {
		copyFile(signaturePath, path.join(packageDir, 'development.sig.json'));
	}

	const marker = path.join(outDir, packageName);
	fs.writeFileSync(marker, JSON.stringify({
		format: 'pcl-n-plugin-package',
		formatVersion: 1,
		id: manifest.id,
		version: manifest.version,
		contentDir: path.basename(packageDir),
		createdAt: new Date().toISOString(),
	}, null, '\t') + '\n');

	console.log(`Packaged ${packageName}`);
	return marker;
}

function developmentSign(root, manifest) {
	const outDir = path.join(root, 'dist');
	ensureDir(outDir);
	const payload = JSON.stringify({
		id: manifest.id,
		version: manifest.version,
		sdkVersion: manifest.sdkVersion,
	});
	const digest = crypto.createHash('sha256').update(payload).digest('hex');
	const signature = {
		type: 'development',
		algorithm: 'sha256',
		digest,
		signedAt: new Date().toISOString(),
		note: 'Community Edition development signature (not for production distribution).',
	};
	const signaturePath = path.join(outDir, 'development.sig.json');
	fs.writeFileSync(signaturePath, JSON.stringify(signature, null, '\t') + '\n');
	console.log(`Wrote development signature ${signaturePath}`);
	return signaturePath;
}

function validatePackage(root, manifest) {
	const outDir = path.join(root, 'dist');
	const packageName = `${manifest.id}-${manifest.version}.pnp`;
	const marker = path.join(outDir, packageName);
	const packageDir = path.join(outDir, packageName.replace(/\.pnp$/, ''));

	if (!fs.existsSync(marker) || !fs.existsSync(packageDir)) {
		console.log(`${MANIFEST}(1,1): error PCL0300: Package not found. Run 'pnp package' first.`);
		return false;
	}

	const packagedManifest = path.join(packageDir, MANIFEST);
	if (!fs.existsSync(packagedManifest)) {
		console.log(`${packageName}(1,1): error PCL0301: Packaged manifest missing.`);
		return false;
	}

	const packaged = JSON.parse(fs.readFileSync(packagedManifest, 'utf8'));
	if (!validateManifest(packaged, packagedManifest)) {
		return false;
	}

	const assemblyRel = packaged.entry.assembly.replace(/\\/g, '/');
	if (!fs.existsSync(path.join(packageDir, assemblyRel))) {
		console.log(`${packageName}(1,1): error PCL0302: Packaged assembly '${assemblyRel}' missing.`);
		return false;
	}

	console.log(`Validation passed for ${packageName}`);
	return true;
}

function main(argv) {
	const args = argv.slice(2);
	if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
		usage();
		process.exit(args.length === 0 ? 1 : 0);
	}
	if (args[0] === '--version' || args[0] === '-v') {
		console.log(VERSION);
		process.exit(0);
	}

	const task = args[0];
	const root = process.cwd();
	const { manifestPath, manifest } = readManifest(root);

	if (!validateManifest(manifest, manifestPath)) {
		process.exit(1);
	}

	switch (task) {
		case 'build': {
			const ok = runDotnetBuild(root);
			process.exit(ok ? 0 : 1);
			break;
		}
		case 'sign': {
			developmentSign(root, manifest);
			process.exit(0);
			break;
		}
		case 'package': {
			packagePlugin(root, manifest);
			process.exit(0);
			break;
		}
		case 'validate': {
			const ok = validatePackage(root, manifest);
			process.exit(ok ? 0 : 1);
			break;
		}
		default:
			fail(`Unknown command '${task}'.`);
	}
}

main(process.argv);
