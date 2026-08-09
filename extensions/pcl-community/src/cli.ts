/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { resolveCliPath } from './environment';

export type PclTask = 'build' | 'package' | 'validate' | 'sign';

export interface CliRunResult {
	readonly exitCode: number;
	readonly stdout: string;
	readonly stderr: string;
}

export async function runPclCli(
	extensionPath: string,
	task: PclTask,
	projectRoot: string,
	output: vscode.OutputChannel,
	extraArgs: string[] = [],
): Promise<CliRunResult> {
	const cliPath = resolveCliPath(extensionPath);
	if (!cliPath) {
		throw new Error('pnp CLI not found. Run "PCL: Check Environment" and configure pcl.community.cliPath.');
	}

	const isJs = cliPath.endsWith('.js');
	const command = isJs ? process.execPath : cliPath;
	const args = isJs ? [cliPath, task, ...extraArgs] : [task, ...extraArgs];

	output.appendLine(`> ${command} ${args.join(' ')}`);
	output.appendLine(`  cwd: ${projectRoot}`);

	return await new Promise<CliRunResult>((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: projectRoot,
			shell: process.platform === 'win32' && !isJs,
			env: process.env,
		});

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
		child.on('close', code => {
			resolve({
				exitCode: code ?? 1,
				stdout,
				stderr,
			});
		});
	});
}
