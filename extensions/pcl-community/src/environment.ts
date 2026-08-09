/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface EnvironmentCheck {
	readonly id: string;
	readonly label: string;
	readonly ok: boolean;
	readonly detail: string;
}

function runCommand(command: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
	try {
		const result = spawnSync(command, args, {
			encoding: 'utf8',
			shell: process.platform === 'win32',
			timeout: 15_000,
		});
		const stdout = (result.stdout ?? '').toString().trim();
		const stderr = (result.stderr ?? '').toString().trim();
		return {
			ok: result.status === 0,
			stdout,
			stderr,
		};
	} catch (error) {
		return {
			ok: false,
			stdout: '',
			stderr: error instanceof Error ? error.message : String(error),
		};
	}
}

export function resolveCliPath(extensionPath: string): string {
	const configured = vscode.workspace.getConfiguration('pcl.community').get<string>('cliPath')?.trim();
	if (configured) {
		return configured;
	}

	// Prefer in-repo Community CLI next to the IDE sources when developing from sources.
	const workspaceRoots = vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath) ?? [];
	const candidates = [
		...workspaceRoots.map(root => path.join(root, 'tools', 'pnp-community-cli', 'bin', 'pnp.js')),
		path.join(extensionPath, '..', '..', 'tools', 'pnp-community-cli', 'bin', 'pnp.js'),
		path.join(extensionPath, 'tools', 'pnp-community-cli', 'bin', 'pnp.js'),
	];

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	// PATH fallback
	const which = runCommand(process.platform === 'win32' ? 'where' : 'which', ['pnp']);
	if (which.ok && which.stdout) {
		return which.stdout.split(/\r?\n/)[0].trim();
	}

	return '';
}

export function checkEnvironment(extensionPath: string): EnvironmentCheck[] {
	const cfg = vscode.workspace.getConfiguration('pcl.community');
	const expectedSdk = cfg.get<string>('sdkVersion') || '0.1.0';
	const dotnetPath = cfg.get<string>('dotnetPath') || 'dotnet';
	const cliPath = resolveCliPath(extensionPath);

	const checks: EnvironmentCheck[] = [];

	const dotnet = runCommand(dotnetPath, ['--version']);
	checks.push({
		id: 'dotnet',
		label: '.NET SDK',
		ok: dotnet.ok,
		detail: dotnet.ok
			? `Found ${dotnet.stdout}`
			: `Unable to run '${dotnetPath} --version'. Install .NET SDK 8+ and ensure it is on PATH. ${dotnet.stderr}`,
	});

	if (!cliPath) {
		checks.push({
			id: 'pnp-cli',
			label: 'PNPSDK / Community pnp CLI',
			ok: false,
			detail: 'No pnp CLI found. Set pcl.community.cliPath or install the Public PNPSDK tooling.',
		});
	} else {
		const isJs = cliPath.endsWith('.js');
		const version = isJs
			? runCommand(process.execPath, [cliPath, '--version'])
			: runCommand(cliPath, ['--version']);
		const versionText = version.stdout || version.stderr;
		const ok = version.ok && versionText.length > 0;
		checks.push({
			id: 'pnp-cli',
			label: 'PNPSDK / Community pnp CLI',
			ok,
			detail: ok
				? `Found ${versionText} at ${cliPath} (expected SDK ${expectedSdk})`
				: `Failed to execute CLI at ${cliPath}. ${version.stderr}`,
		});
	}

	return checks;
}

export function formatEnvironmentReport(checks: EnvironmentCheck[]): string {
	const lines = ['PCL Community environment check:', ''];
	for (const check of checks) {
		lines.push(`${check.ok ? '✓' : '✗'} ${check.label}: ${check.detail}`);
	}
	const failed = checks.filter(c => !c.ok);
	lines.push('');
	lines.push(failed.length ? `${failed.length} issue(s) found.` : 'All checks passed.');
	return lines.join('\n');
}
