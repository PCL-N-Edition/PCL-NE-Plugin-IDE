/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { runPclCli, PclTask } from './cli';
import { PclDiagnosticController } from './diagnostics';
import { checkEnvironment, formatEnvironmentReport } from './environment';
import { tryLoadProjects } from './project';
import { createHelloPclProject, promptCreateProject } from './template';

let output: vscode.OutputChannel;
let diagnostics: PclDiagnosticController;
const isPluginWorkspace = 'pcl.community.isPluginWorkspace';

function refreshContextAndDiagnostics(): void {
	const projects = tryLoadProjects(vscode.workspace.workspaceFolders);
	void vscode.commands.executeCommand('setContext', isPluginWorkspace, projects.length > 0);
	diagnostics.refreshManifestProjects(projects);
}

async function pickProjectRoot(): Promise<string | undefined> {
	const projects = tryLoadProjects(vscode.workspace.workspaceFolders);
	if (!projects.length) {
		void vscode.window.showErrorMessage('No plugin.manifest.json found in the workspace.');
		return undefined;
	}
	if (projects.length === 1) {
		return projects[0].root;
	}
	const picked = await vscode.window.showQuickPick(
		projects.map(p => ({
			label: p.manifest.name,
			description: p.manifest.id,
			detail: p.root,
			root: p.root,
		})),
		{ placeHolder: 'Select a PCL plugin project' },
	);
	return picked?.root;
}

async function runTask(extensionPath: string, task: PclTask, successMessage: string): Promise<void> {
	const projectRoot = await pickProjectRoot();
	if (!projectRoot) {
		return;
	}

	output.show(true);
	try {
		const result = await runPclCli(extensionPath, task, projectRoot, output);
		diagnostics.applyCliOutput(projectRoot, `${result.stdout}\n${result.stderr}`);
		if (result.exitCode === 0) {
			void vscode.window.showInformationMessage(successMessage);
		} else {
			void vscode.window.showErrorMessage(`PCL ${task} failed (exit ${result.exitCode}). See PCL Community output.`);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		output.appendLine(message);
		void vscode.window.showErrorMessage(message);
	}
}

export function activate(context: vscode.ExtensionContext): void {
	output = vscode.window.createOutputChannel('PCL Community');
	diagnostics = new PclDiagnosticController();

	context.subscriptions.push(output, diagnostics);

	context.subscriptions.push(
		vscode.commands.registerCommand('pcl.community.createProject', async () => {
			const sdkVersion = vscode.workspace.getConfiguration('pcl.community').get<string>('sdkVersion') || '0.1.0';
			const options = await promptCreateProject(sdkVersion);
			if (!options) {
				return;
			}
			try {
				const dir = await createHelloPclProject(options);
				refreshContextAndDiagnostics();
				const open = await vscode.window.showInformationMessage(
					`Created plugin project at ${dir}`,
					'Open Folder',
				);
				if (open === 'Open Folder') {
					await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(dir), true);
				}
			} catch (error) {
				void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
			}
		}),
		vscode.commands.registerCommand('pcl.community.checkEnvironment', async () => {
			const checks = checkEnvironment(context.extensionPath);
			const report = formatEnvironmentReport(checks);
			output.clear();
			output.appendLine(report);
			output.show(true);
			if (checks.every(c => c.ok)) {
				void vscode.window.showInformationMessage('PCL environment checks passed.');
			} else {
				void vscode.window.showWarningMessage('PCL environment has issues. See PCL Community output.');
			}
		}),
		vscode.commands.registerCommand('pcl.community.build', () =>
			runTask(context.extensionPath, 'build', 'Plugin build completed.')),
		vscode.commands.registerCommand('pcl.community.package', () =>
			runTask(context.extensionPath, 'package', 'Plugin package (.pnp) created.')),
		vscode.commands.registerCommand('pcl.community.validate', () =>
			runTask(context.extensionPath, 'validate', 'Plugin package validation passed.')),
		vscode.commands.registerCommand('pcl.community.developmentSign', () =>
			runTask(context.extensionPath, 'sign', 'Development signature applied.')),
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(() => refreshContextAndDiagnostics()),
		vscode.workspace.onDidSaveTextDocument(doc => {
			if (doc.fileName.endsWith('plugin.manifest.json')) {
				refreshContextAndDiagnostics();
			}
		}),
	);

	refreshContextAndDiagnostics();
}

export function deactivate(): void {
	// disposables cleaned via context.subscriptions
}
