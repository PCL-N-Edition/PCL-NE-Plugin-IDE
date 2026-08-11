/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import { PluginProject, validateManifestShape } from './project';

const ANALYZER_LINE = /^(.*)\((\d+),(\d+)(?:,\d+,\d+)?\):\s+(error|warning|info)\s+(PNPSDK\d+|[A-Z]{2,}\d+):\s+(.*?)(?:\s+\[.*\])?$/i;

export class PclDiagnosticController implements vscode.Disposable {
	private readonly collection = vscode.languages.createDiagnosticCollection('pcl-community');

	refreshManifestProjects(projects: PluginProject[]): void {
		this.collection.clear();
		for (const project of projects) {
			const diagnostics = validateManifestShape(project.manifest).map(message => {
				const diagnostic = new vscode.Diagnostic(
					new vscode.Range(0, 0, 0, 1),
					message,
					vscode.DiagnosticSeverity.Error,
				);
				diagnostic.source = 'Public PNPSDK manifest';
				diagnostic.code = 'PNPSDK-MANIFEST';
				return diagnostic;
			});
			this.collection.set(vscode.Uri.file(project.manifestPath), diagnostics);
		}
	}

	applyBuildOutput(projectRoot: string, combinedOutput: string): void {
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
			diagnostic.source = code.toUpperCase().startsWith('PNPSDK') ? 'PNPSDK Analyzer' : '.NET';
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
		this.collection.dispose();
	}
}
