/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, StreamInfo } from 'vscode-languageclient/node';
import { CSHARP_LS_VERSION, managedCsharpLsPath, resolveCsharpLsPath } from './environment';

function decodeConsoleLine(line: Buffer): string {
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(line);
	} catch {
		// .NET console output follows the active Windows code page. Simplified
		// Chinese systems commonly emit GBK even though the LSP stream is UTF-8.
		return new TextDecoder(process.platform === 'win32' ? 'gbk' : 'utf-8').decode(line);
	}
}

export class CSharpLanguageService implements vscode.Disposable {
	private client: LanguageClient | undefined;
	private serverProcess: ChildProcessWithoutNullStreams | undefined;
	private starting: Promise<void> | undefined;
	private offeredInstall = false;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly output: vscode.LogOutputChannel,
	) { }

	async ensureStarted(interactive: boolean): Promise<void> {
		if (this.client) {
			return;
		}
		if (this.starting) {
			return this.starting;
		}
		this.starting = this.start(interactive).finally(() => this.starting = undefined);
		return this.starting;
	}

	private async start(interactive: boolean): Promise<void> {
		let executable = resolveCsharpLsPath(this.context.globalStorageUri.fsPath);
		const autoInstall = vscode.workspace.getConfiguration('pcl.community').get<boolean>('csharpLsAutoInstall') ?? true;
		if (!executable && autoInstall) {
			await this.installOrUpdate();
			executable = resolveCsharpLsPath(this.context.globalStorageUri.fsPath);
		}
		if (!executable) {
			if (interactive || !this.offeredInstall) {
				this.offeredInstall = true;
				const install = vscode.l10n.t('Install C# Language Server');
				const selected = await vscode.window.showWarningMessage(
					vscode.l10n.t('Roslyn C# language features require csharp-ls {0}.', CSHARP_LS_VERSION),
					install,
				);
				if (selected === install) {
					await this.installOrUpdate();
					executable = resolveCsharpLsPath(this.context.globalStorageUri.fsPath);
				}
			}
			if (!executable) {
				return;
			}
		}

		const serverOptions: ServerOptions = async (): Promise<StreamInfo> => {
			const serverProcess = spawn(executable, [], {
				shell: false,
				windowsHide: true,
				stdio: 'pipe',
				env: process.env,
			});
			this.serverProcess = serverProcess;
			let pending = Buffer.alloc(0);
			const flushLines = (flushRemainder: boolean): void => {
				let newline: number;
				while ((newline = pending.indexOf(0x0A)) !== -1) {
					let line = pending.subarray(0, newline);
					pending = pending.subarray(newline + 1);
					if (line.at(-1) === 0x0D) {
						line = line.subarray(0, -1);
					}
					if (line.length > 0) {
						this.output.error(decodeConsoleLine(line));
					}
				}
				if (flushRemainder && pending.length > 0) {
					this.output.error(decodeConsoleLine(pending));
					pending = Buffer.alloc(0);
				}
			};
			serverProcess.stderr.on('data', (chunk: Buffer) => {
				pending = Buffer.concat([pending, chunk]);
				flushLines(false);
			});
			serverProcess.stderr.once('end', () => flushLines(true));
			serverProcess.once('exit', () => {
				if (this.serverProcess === serverProcess) {
					this.serverProcess = undefined;
				}
			});
			return { reader: serverProcess.stdout, writer: serverProcess.stdin };
		};
		const clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: 'file', language: 'csharp' }],
			outputChannel: this.output,
			synchronize: {
				fileEvents: [
					vscode.workspace.createFileSystemWatcher('**/*.csproj'),
					vscode.workspace.createFileSystemWatcher('**/*.slnx'),
					vscode.workspace.createFileSystemWatcher('**/Directory.Build.*'),
				],
			},
		};
		this.client = new LanguageClient(
			'pclCSharpLanguageServer',
			'PCL C# Language Server',
			serverOptions,
			clientOptions,
		);
		await this.client.start();
		this.output.appendLine(`Roslyn language server started: ${executable}`);
	}

	async installOrUpdate(): Promise<void> {
		const configured = vscode.workspace.getConfiguration('pcl.community').get<string>('csharpLsPath')?.trim();
		if (configured) {
			if (!fs.existsSync(configured)) {
				throw new Error(`Configured csharp-ls executable does not exist: ${configured}`);
			}
			return;
		}
		const binary = managedCsharpLsPath(this.context.globalStorageUri.fsPath);
		const toolDir = path.dirname(binary);
		fs.mkdirSync(toolDir, { recursive: true });
		const dotnet = vscode.workspace.getConfiguration('pcl.community').get<string>('dotnetPath') || 'dotnet';
		const verb = fs.existsSync(binary) ? 'update' : 'install';
		const args = ['tool', verb, 'csharp-ls', '--tool-path', toolDir, '--version', CSHARP_LS_VERSION];

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: vscode.l10n.t('Installing Roslyn C# language server {0}…', CSHARP_LS_VERSION),
			cancellable: false,
		}, () => new Promise<void>((resolve, reject) => {
			this.output.show(true);
			this.output.appendLine(`> ${dotnet} ${args.join(' ')}`);
			const child = spawn(dotnet, args, { shell: false, env: process.env });
			child.stdout.on('data', chunk => this.output.append(chunk.toString()));
			child.stderr.on('data', chunk => this.output.append(chunk.toString()));
			child.on('error', reject);
			child.on('close', code => code === 0
				? resolve()
				: reject(new Error(`dotnet tool ${verb} csharp-ls failed with exit code ${code ?? 1}.`)));
		}));
	}

	dispose(): void {
		if (this.client) {
			void this.client.stop();
			this.client = undefined;
		}
		if (this.serverProcess && !this.serverProcess.killed) {
			this.serverProcess.kill();
			this.serverProcess = undefined;
		}
	}
}
