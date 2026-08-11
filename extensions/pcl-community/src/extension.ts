/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { PclTask, runPclTask } from './cli';
import { CSharpLanguageService } from './csharpLanguageServer';
import { PclDiagnosticController } from './diagnostics';
import { checkEnvironment, formatEnvironmentReport } from './environment';
import { findNplugInDirectory } from './nplug';
import { openPluginProject } from './openProject';
import { tryLoadProjects } from './project';
import { PclTaskProvider } from './tasks';
import { createHelloPclProject, promptCreateProject } from './template';

let output: vscode.LogOutputChannel;
let diagnostics: PclDiagnosticController;
let csharp: CSharpLanguageService;
const isPluginWorkspace = 'pcl.community.isPluginWorkspace';

function getSdkVersion(): string {
	return vscode.workspace.getConfiguration('pcl.community').get<string>('sdkVersion') || '0.2.5';
}

function refreshContextAndDiagnostics(): void {
	const projects = tryLoadProjects(vscode.workspace.workspaceFolders);
	const hasNplug = (vscode.workspace.workspaceFolders ?? []).some(folder =>
		!!findNplugInDirectory(folder.uri.fsPath));
	void vscode.commands.executeCommand('setContext', isPluginWorkspace, projects.length > 0 || hasNplug);
	diagnostics.refreshManifestProjects(projects);
	if (projects.length > 0 || hasNplug) {
		void csharp.ensureStarted(false).catch(error => output.appendLine(String(error)));
	}
}

async function pickProjectRoot(): Promise<string | undefined> {
	const projects = tryLoadProjects(vscode.workspace.workspaceFolders);
	if (!projects.length) {
		const folders = vscode.workspace.workspaceFolders;
		if (folders?.length === 1 && findNplugInDirectory(folders[0].uri.fsPath)) {
			return folders[0].uri.fsPath;
		}
		void vscode.window.showErrorMessage(vscode.l10n.t('No PCL plugin project found (expected plugin.json and a .csproj).'));
		return undefined;
	}
	if (projects.length === 1) {
		return projects[0].root;
	}
	const picked = await vscode.window.showQuickPick(
		projects.map(project => ({
			label: project.manifest.name,
			description: project.manifest.id,
			detail: project.root,
			root: project.root,
		})),
		{ placeHolder: vscode.l10n.t('Select a PCL plugin project') },
	);
	return picked?.root;
}

async function runTask(task: PclTask, successMessage: string): Promise<void> {
	const projectRoot = await pickProjectRoot();
	if (!projectRoot) {
		return;
	}
	output.show(true);
	try {
		const result = await runPclTask(task, projectRoot, output);
		diagnostics.applyBuildOutput(projectRoot, `${result.stdout}\n${result.stderr}`);
		if (result.exitCode === 0) {
			const detail = result.packagePath ? ` ${result.packagePath}` : '';
			void vscode.window.showInformationMessage(`${successMessage}${detail}`);
		} else {
			void vscode.window.showErrorMessage(vscode.l10n.t('PCL {0} failed with exit code {1}. See PCL Community output.', task, result.exitCode));
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		output.appendLine(message);
		void vscode.window.showErrorMessage(message);
	}
}

export function activate(context: vscode.ExtensionContext): void {
	output = vscode.window.createOutputChannel('PCL Community', { log: true });
	diagnostics = new PclDiagnosticController();
	csharp = new CSharpLanguageService(context, output);
	context.subscriptions.push(output, diagnostics, csharp);

	context.subscriptions.push(
		vscode.commands.registerCommand('pcl.community.openProject', () => openPluginProject(getSdkVersion())),
		vscode.commands.registerCommand('pcl.community.createProject', async () => {
			const options = await promptCreateProject(getSdkVersion());
			if (!options) {
				return;
			}
			try {
				const dir = await createHelloPclProject(options);
				const open = await vscode.window.showInformationMessage(
					vscode.l10n.t('Created plugin project at {0}', dir),
					vscode.l10n.t('Open Project'),
				);
				if (open === vscode.l10n.t('Open Project')) {
					await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(dir), false);
				}
			} catch (error) {
				void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
			}
		}),
		vscode.commands.registerCommand('pcl.community.newFile', () =>
			vscode.commands.executeCommand('workbench.action.files.newUntitledFile')),
		vscode.commands.registerCommand('pcl.community.checkEnvironment', () => {
			const checks = checkEnvironment(context.globalStorageUri.fsPath);
			output.clear();
			output.appendLine(formatEnvironmentReport(checks));
			output.show(true);
			const message = checks.every(check => check.ok)
				? vscode.l10n.t('PCL environment checks passed.')
				: vscode.l10n.t('PCL environment has issues. See PCL Community output.');
			void vscode.window.showInformationMessage(message);
		}),
		vscode.commands.registerCommand('pcl.community.installCsharpLanguageServer', async () => {
			try {
				await csharp.installOrUpdate();
				await csharp.ensureStarted(true);
				void vscode.window.showInformationMessage(vscode.l10n.t('C# language server is ready.'));
			} catch (error) {
				void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
			}
		}),
		vscode.commands.registerCommand('pcl.community.restore', () =>
			runTask('restore', vscode.l10n.t('Plugin dependencies restored.'))),
		vscode.commands.registerCommand('pcl.community.build', () =>
			runTask('build', vscode.l10n.t('Plugin build completed.'))),
		vscode.commands.registerCommand('pcl.community.package', () =>
			runTask('package', vscode.l10n.t('Development-signed plugin package created:'))),
		vscode.commands.registerCommand('pcl.community.validate', () =>
			runTask('validate', vscode.l10n.t('Plugin package validation passed:'))),
		vscode.commands.registerCommand('pcl.community.developmentSign', () =>
			runTask('sign', vscode.l10n.t('Development-signed plugin package created:'))),
		vscode.tasks.registerTaskProvider('pcl', new PclTaskProvider()),
		vscode.workspace.onDidChangeWorkspaceFolders(refreshContextAndDiagnostics),
		vscode.workspace.onDidSaveTextDocument(document => {
			if (document.fileName.endsWith('plugin.json') || document.fileName.endsWith('.nplug')) {
				refreshContextAndDiagnostics();
			}
		}),
	);
	refreshContextAndDiagnostics();
}

export function deactivate(): void {
	// Disposables are owned by the extension context.
}
