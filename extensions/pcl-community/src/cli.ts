/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as yauzl from 'yauzl';
import { findCsprojInDirectory } from './nplug';

export type PclTask = 'restore' | 'build' | 'package' | 'validate' | 'sign';

export interface PclRunResult {
	readonly exitCode: number;
	readonly stdout: string;
	readonly stderr: string;
	readonly packagePath?: string;
}

function runProcess(
	command: string,
	args: string[],
	cwd: string,
	output: vscode.OutputChannel,
): Promise<PclRunResult> {
	output.appendLine(`> ${command} ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
	output.appendLine(`  cwd: ${cwd}`);
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd, shell: false, env: process.env });
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (chunk: Buffer | string) => {
			const text = chunk.toString();
			stdout += text;
			output.append(text);
		});
		child.stderr.on('data', (chunk: Buffer | string) => {
			const text = chunk.toString();
			stderr += text;
			output.append(text);
		});
		child.on('error', reject);
		child.on('close', code => resolve({ exitCode: code ?? 1, stdout, stderr }));
	});
}

function findLatestPnp(projectRoot: string): string | undefined {
	const root = path.join(projectRoot, 'bin');
	if (!fs.existsSync(root)) {
		return undefined;
	}
	const found: { file: string; mtime: number }[] = [];
	const visit = (dir: string): void => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				visit(fullPath);
			} else if (entry.name.toLowerCase().endsWith('.pnp')) {
				found.push({ file: fullPath, mtime: fs.statSync(fullPath).mtimeMs });
			}
		}
	};
	visit(root);
	return found.sort((a, b) => b.mtime - a.mtime)[0]?.file;
}

export function validatePnp(packagePath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		yauzl.open(packagePath, { lazyEntries: true }, (openError, zip) => {
			if (openError || !zip) {
				reject(openError ?? new Error('Unable to open .pnp package.'));
				return;
			}
			const entries = new Set<string>();
			zip.readEntry();
			zip.on('entry', entry => {
				entries.add(entry.fileName.replace(/\\/g, '/'));
				zip.readEntry();
			});
			zip.on('error', reject);
			zip.on('end', () => {
				const required = ['plugin.json', 'META-INF/pnp.files.json', 'META-INF/pnp.signed.json'];
				const missing = required.filter(name => !entries.has(name));
				if (![...entries].some(name => /^lib\/net10\.0\/.+\.dll$/i.test(name))) {
					missing.push('lib/net10.0/<entry assembly>.dll');
				}
				if (![...entries].some(name => /^META-INF\/keys\/.+\.asc$/i.test(name))) {
					missing.push('META-INF/keys/<fingerprint>.asc');
				}
				if (![...entries].some(name => /^META-INF\/signatures\/.+\.asc$/i.test(name))) {
					missing.push('META-INF/signatures/<fingerprint>.asc');
				}
				if (missing.length) {
					reject(new Error(`Invalid .pnp package; missing: ${missing.join(', ')}`));
				} else {
					resolve();
				}
			});
		});
	});
}

export async function runPclTask(
	task: PclTask,
	projectRoot: string,
	output: vscode.OutputChannel,
): Promise<PclRunResult> {
	const project = findCsprojInDirectory(projectRoot);
	if (!project) {
		throw new Error('No .csproj was found in the selected PCL plugin project.');
	}
	const dotnetPath = vscode.workspace.getConfiguration('pcl.community').get<string>('dotnetPath') || 'dotnet';
	const args = task === 'restore'
		? ['restore', project]
		: task === 'build'
			? ['build', project, '-c', 'Debug']
			: ['build', project, '-c', 'Release'];
	const result = await runProcess(dotnetPath, args, projectRoot, output);
	if (result.exitCode !== 0 || task === 'restore' || task === 'build') {
		return result;
	}
	const packagePath = findLatestPnp(projectRoot);
	if (!packagePath) {
		return {
			...result,
			exitCode: 1,
			stderr: `${result.stderr}\nPublic PNPSDK build completed without producing a .pnp package.`,
		};
	}
	if (task === 'validate') {
		await validatePnp(packagePath);
		output.appendLine(`Validated signed package: ${packagePath}`);
	}
	return { ...result, packagePath };
}
