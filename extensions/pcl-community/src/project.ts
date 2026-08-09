/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export const MANIFEST_FILE = 'plugin.manifest.json';

export interface PluginManifest {
	schemaVersion: string;
	id: string;
	name: string;
	version: string;
	sdkVersion: string;
	description?: string;
	author?: string;
	license?: string;
	entry: {
		assembly: string;
		type: string;
	};
	permissions?: string[];
}

export interface PluginProject {
	readonly root: string;
	readonly manifestPath: string;
	readonly manifest: PluginManifest;
}

export function findManifestPaths(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): string[] {
	if (!workspaceFolders?.length) {
		return [];
	}

	const results: string[] = [];
	for (const folder of workspaceFolders) {
		const direct = path.join(folder.uri.fsPath, MANIFEST_FILE);
		if (fs.existsSync(direct)) {
			results.push(direct);
			continue;
		}

		// Shallow scan one level for monorepo-style layouts.
		try {
			for (const entry of fs.readdirSync(folder.uri.fsPath, { withFileTypes: true })) {
				if (!entry.isDirectory() || entry.name.startsWith('.')) {
					continue;
				}
				const candidate = path.join(folder.uri.fsPath, entry.name, MANIFEST_FILE);
				if (fs.existsSync(candidate)) {
					results.push(candidate);
				}
			}
		} catch {
			// ignore unreadable folders
		}
	}
	return results;
}

export function readManifest(manifestPath: string): PluginManifest {
	const raw = fs.readFileSync(manifestPath, 'utf8');
	const parsed = JSON.parse(raw) as PluginManifest;
	return parsed;
}

export function tryLoadProjects(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): PluginProject[] {
	return findManifestPaths(workspaceFolders).map(manifestPath => ({
		root: path.dirname(manifestPath),
		manifestPath,
		manifest: readManifest(manifestPath),
	}));
}

export function validateManifestShape(manifest: PluginManifest): string[] {
	const errors: string[] = [];
	if (manifest.schemaVersion !== '1.0') {
		errors.push(`Unsupported schemaVersion '${manifest.schemaVersion}'. Expected '1.0'.`);
	}
	if (!manifest.id || !/^[a-z0-9]+(\.[a-z0-9\-]+)+$/.test(manifest.id)) {
		errors.push(`Invalid id '${manifest.id ?? ''}'. Use reverse-DNS form (e.g. com.example.hello-pcl).`);
	}
	if (!manifest.name?.trim()) {
		errors.push('name is required.');
	}
	if (!manifest.version || !/^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$/.test(manifest.version)) {
		errors.push(`Invalid version '${manifest.version ?? ''}'.`);
	}
	if (!manifest.sdkVersion || !/^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$/.test(manifest.sdkVersion)) {
		errors.push(`Invalid sdkVersion '${manifest.sdkVersion ?? ''}'.`);
	}
	if (!manifest.entry?.assembly?.trim() || !manifest.entry?.type?.trim()) {
		errors.push('entry.assembly and entry.type are required.');
	}
	return errors;
}
