/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export const CSHARP_LS_VERSION = '0.26.0';

export interface EnvironmentCheck {
	readonly id: string;
	readonly label: string;
	readonly ok: boolean;
	readonly detail: string;
}

function runCommand(command: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
	try {
		const result = spawnSync(command, args, { encoding: 'utf8', timeout: 20_000, shell: false });
		return {
			ok: result.status === 0,
			stdout: (result.stdout ?? '').toString().trim(),
			stderr: (result.stderr ?? '').toString().trim(),
		};
	} catch (error) {
		return { ok: false, stdout: '', stderr: error instanceof Error ? error.message : String(error) };
	}
}

export function managedCsharpLsPath(globalStoragePath: string): string {
	return path.join(
		globalStoragePath,
		'tools',
		`csharp-ls-${CSHARP_LS_VERSION}`,
		process.platform === 'win32' ? 'csharp-ls.exe' : 'csharp-ls',
	);
}

export function resolveCsharpLsPath(globalStoragePath: string): string | undefined {
	const configured = vscode.workspace.getConfiguration('pcl.community').get<string>('csharpLsPath')?.trim();
	if (configured) {
		return fs.existsSync(configured) ? configured : undefined;
	}
	const managed = managedCsharpLsPath(globalStoragePath);
	if (fs.existsSync(managed)) {
		return managed;
	}
	const probe = runCommand('csharp-ls', ['--version']);
	return probe.ok ? 'csharp-ls' : undefined;
}

export function checkEnvironment(globalStoragePath: string): EnvironmentCheck[] {
	const cfg = vscode.workspace.getConfiguration('pcl.community');
	const expectedSdk = cfg.get<string>('sdkVersion') || '0.2.5';
	const dotnetPath = cfg.get<string>('dotnetPath') || 'dotnet';
	const dotnet = runCommand(dotnetPath, ['--version']);
	const dotnetMajor = Number.parseInt(dotnet.stdout.split('.')[0], 10);
	const csharpLs = resolveCsharpLsPath(globalStoragePath);
	return [
		{
			id: 'dotnet',
			label: '.NET SDK 10',
			ok: dotnet.ok && dotnetMajor >= 10,
			detail: dotnet.ok && dotnetMajor >= 10
				? `Found ${dotnet.stdout}`
				: `Install .NET SDK 10 and ensure '${dotnetPath}' is available. ${dotnet.stderr}`.trim(),
		},
		{
			id: 'pnpsdk',
			label: 'Public PNPSDK',
			ok: true,
			detail: `Generated projects restore PCLN.Plugin.* ${expectedSdk} from NuGet.`,
		},
		{
			id: 'csharp-ls',
			label: 'Roslyn C# language server',
			ok: !!csharpLs,
			detail: csharpLs
				? `Found ${csharpLs} (pinned tool version ${CSHARP_LS_VERSION}).`
				: 'Not installed. Run “PCL: Install or Update C# Language Server”.',
		},
	];
}

export function formatEnvironmentReport(checks: EnvironmentCheck[]): string {
	const lines = ['PCL Community environment check:', ''];
	for (const check of checks) {
		lines.push(`${check.ok ? '✓' : '✗'} ${check.label}: ${check.detail}`);
	}
	const failed = checks.filter(check => !check.ok);
	lines.push('', failed.length ? `${failed.length} issue(s) found.` : 'All checks passed.');
	return lines.join('\n');
}
