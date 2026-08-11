/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
	buildNplugFromParts,
	findCsprojInDirectory,
	findNplugInDirectory,
	findSlnxInDirectory,
	isCsprojPath,
	isNplugPath,
	isSlnxPath,
	readNplug,
	resolveProjectRootFromFile,
	writeNplug,
} from './nplug';

async function ensureNplugForRoot(projectRoot: string, sdkVersion: string): Promise<'open' | 'cancel'> {
	const existing = findNplugInDirectory(projectRoot);
	if (existing) {
		try {
			readNplug(existing);
			return 'open';
		} catch (error) {
			void vscode.window.showErrorMessage(
				`Unable to read .nplug: ${error instanceof Error ? error.message : String(error)}`,
			);
			return 'cancel';
		}
	}

	const confirmOpen = 'Confirm as Plugin project and open';
	const createAndOpen = 'Create .nplug and open';
	const cancel = 'Cancel';

	const choice = await vscode.window.showWarningMessage(
		`No .nplug project file was found.\n\nFolder: ${projectRoot}\n\nOpen this folder as a Plugin project?`,
		{ modal: true },
		confirmOpen,
		createAndOpen,
		cancel,
	);

	if (!choice || choice === cancel) {
		return 'cancel';
	}

	if (choice === confirmOpen) {
		return 'open';
	}

	const csproj = findCsprojInDirectory(projectRoot);
	const assembly = csproj
		? path.basename(csproj, path.extname(csproj))
		: path.basename(projectRoot);
	const pluginId = `com.local.${assembly.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
	const projectFileName = csproj ? path.basename(csproj) : `${assembly}.csproj`;
	const solution = findSlnxInDirectory(projectRoot);
	const solutionFileName = solution ? path.basename(solution) : `${assembly}.slnx`;

	const nplugPath = path.join(projectRoot, `${assembly}.nplug`);
	writeNplug(nplugPath, buildNplugFromParts({
		id: pluginId,
		name: assembly,
		sdkVersion,
		author: 'Community Developer',
		description: `Auto-generated .nplug for ${assembly}`,
		assemblyName: assembly,
		projectFileName,
		solutionFileName,
	}));

	if (!solution && csproj) {
		fs.writeFileSync(
			path.join(projectRoot, solutionFileName),
			`<Solution>\n  <Project Path="${projectFileName}" />\n</Solution>\n`,
			'utf8',
		);
	}

	void vscode.window.showInformationMessage(`Created ${path.basename(nplugPath)}`);
	return 'open';
}

export async function openPluginProject(sdkVersion: string): Promise<void> {
	const picked = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		openLabel: 'Open Plugin Project',
		title: 'Open Plugin Project',
		filters: {
			'Plugin Project': ['nplug', 'slnx', 'csproj'],
			'NPLUG': ['nplug'],
			'Solution': ['slnx'],
			'C# Project': ['csproj'],
			'All Files': ['*'],
		},
	});

	if (!picked?.length) {
		return;
	}

	const selected = picked[0].fsPath;
	if (!isNplugPath(selected) && !isSlnxPath(selected) && !isCsprojPath(selected)) {
		const cont = await vscode.window.showWarningMessage(
			`The selected file is not a .nplug / .slnx / .csproj:\n${selected}\n\nOpen it as a project anyway?`,
			{ modal: true },
			'Continue',
			'Cancel',
		);
		if (cont !== 'Continue') {
			return;
		}
	}

	const projectRoot = resolveProjectRootFromFile(selected);

	if (isNplugPath(selected)) {
		try {
			readNplug(selected);
		} catch (error) {
			void vscode.window.showErrorMessage(
				`Unable to read .nplug: ${error instanceof Error ? error.message : String(error)}`,
			);
			return;
		}
	} else {
		const result = await ensureNplugForRoot(projectRoot, sdkVersion);
		if (result === 'cancel') {
			return;
		}
	}

	await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectRoot), false);
}
