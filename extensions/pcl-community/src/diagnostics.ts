/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import { PluginProject, validateManifestShape } from './project';

const COLLECTION_NAME = 'pcl-community';

/**
 * Maps structured analyzer / CLI diagnostics into the Problems panel.
 * Supported line format:
 *   path(line,col): error|warning|info PCLxxxx: message
 */
const ANALYZER_LINE = /^(.*)\((\d+),(\d+)\):\s+(error|warning|info)\s+(PCL\d+):\s+(.*)$/i;

export class PclDiagnosticController implements vscode.Disposable {
	private readonly collection: vscode.DiagnosticCollection;
	private readonly disposables: vscode.Disposable[] = [];

	constructor() {
		this.collection = vscode.languages.createDiagnosticCollection(COLLECTION_NAME);
		this.disposables.push(this.collection);
	}

	refreshManifestProjects(projects: PluginProject[]): void {
		this.collection.clear();
		for (const project of projects) {
			const errors = validateManifestShape(project.manifest);
			const diagnostics = errors.map(message => {
				const range = new vscode.Range(0, 0, 0, 1);
				const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
				diagnostic.source = 'pcl-manifest';
				diagnostic.code = 'PCL0001';
				return diagnostic;
			});
			this.collection.set(vscode.Uri.file(project.manifestPath), diagnostics);
		}
	}

	applyCliOutput(projectRoot: string, combinedOutput: string): void {
		const byFile = new Map<string, vscode.Diagnostic[]>();

		for (const line of combinedOutput.split(/\r?\n/)) {
			const match = ANALYZER_LINE.exec(line.trim());
			if (!match) {
				continue;
			}
			const [, file, lineText, colText, severityText, code, message] = match;
			const absolute = path.isAbsolute(file) ? file : path.join(projectRoot, file);
			const severity = severityText.toLowerCase() === 'error'
				? vscode.DiagnosticSeverity.Error
				: severityText.toLowerCase() === 'warning'
					? vscode.DiagnosticSeverity.Warning
					: vscode.DiagnosticSeverity.Information;
			const lineNumber = Math.max(0, Number(lineText) - 1);
			const colNumber = Math.max(0, Number(colText) - 1);
			const diagnostic = new vscode.Diagnostic(
				new vscode.Range(lineNumber, colNumber, lineNumber, colNumber + 1),
				message,
				severity,
			);
			diagnostic.source = 'pcl-analyzer';
			diagnostic.code = code;
			const list = byFile.get(absolute) ?? [];
			list.push(diagnostic);
			byFile.set(absolute, list);
		}

		for (const [file, diagnostics] of byFile) {
			this.collection.set(vscode.Uri.file(file), diagnostics);
		}
	}

	dispose(): void {
		for (const d of this.disposables) {
			d.dispose();
		}
	}
}
