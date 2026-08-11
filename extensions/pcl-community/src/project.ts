/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export const MANIFEST_FILE = 'plugin.json';

export interface PluginManifest {
	formatVersion: number;
	manifestVersion: number;
	id: string;
	name: string;
	version: string;
	publisher: {
		id: string;
		namespace: string;
	};
	license: string;
	entryPoint: {
		assembly: string;
		type: string;
	};
	api: {
		minimum: string;
		maximumExclusive: string;
	};
	host: {
		minimumVersion: string;
	};
	localization: {
		defaultCulture: string;
		supportedCultures: string[];
		resourcePath: string;
	};
	signing: {
		fingerprint: string;
	} | null;
}

export interface PluginProject {
	readonly root: string;
	readonly manifestPath: string;
	readonly manifest: PluginManifest;
}

function directoryHasNplug(dir: string): boolean {
	try {
		return fs.readdirSync(dir).some(name => name.toLowerCase().endsWith('.nplug'));
	} catch {
		return false;
	}
}

function collectProjectRoots(folderPath: string): string[] {
	const roots: string[] = [];
	const directManifest = path.join(folderPath, MANIFEST_FILE);
	if (fs.existsSync(directManifest) || directoryHasNplug(folderPath)) {
		roots.push(folderPath);
		return roots;
	}

	try {
		for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
			if (!entry.isDirectory() || entry.name.startsWith('.')) {
				continue;
			}
			const child = path.join(folderPath, entry.name);
			if (fs.existsSync(path.join(child, MANIFEST_FILE)) || directoryHasNplug(child)) {
				roots.push(child);
			}
		}
	} catch {
		// Ignore unreadable folders.
	}
	return roots;
}

export function findManifestPaths(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): string[] {
	if (!workspaceFolders?.length) {
		return [];
	}
	const results: string[] = [];
	for (const folder of workspaceFolders) {
		for (const root of collectProjectRoots(folder.uri.fsPath)) {
			const manifest = path.join(root, MANIFEST_FILE);
			if (fs.existsSync(manifest)) {
				results.push(manifest);
			}
		}
	}
	return results;
}

export function readManifest(manifestPath: string): PluginManifest {
	return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PluginManifest;
}

export function tryLoadProjects(workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined): PluginProject[] {
	if (!workspaceFolders?.length) {
		return [];
	}
	const projects: PluginProject[] = [];
	for (const folder of workspaceFolders) {
		for (const root of collectProjectRoots(folder.uri.fsPath)) {
			const manifestPath = path.join(root, MANIFEST_FILE);
			if (!fs.existsSync(manifestPath)) {
				continue;
			}
			try {
				projects.push({ root, manifestPath, manifest: readManifest(manifestPath) });
			} catch {
				// The JSON language service reports parse errors. Do not break activation.
			}
		}
	}
	return projects;
}

export function validateManifestShape(manifest: PluginManifest): string[] {
	const errors: string[] = [];
	if (manifest.formatVersion !== 1 || manifest.manifestVersion !== 1) {
		errors.push('formatVersion and manifestVersion must both be 1.');
	}
	if (!manifest.id || !/^[a-z0-9]+([.-][a-z0-9]+)*$/.test(manifest.id)) {
		errors.push(`Invalid id '${manifest.id ?? ''}'. Use a lower-case reverse-domain identifier.`);
	}
	if (!manifest.name?.trim()) {
		errors.push('name is required.');
	}
	if (!manifest.version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version)) {
		errors.push(`Invalid version '${manifest.version ?? ''}'.`);
	}
	if (!manifest.entryPoint?.assembly?.startsWith('lib/net10.0/') || !manifest.entryPoint?.type?.trim()) {
		errors.push('entryPoint.assembly must target lib/net10.0 and entryPoint.type is required.');
	}
	if (!manifest.publisher?.id || !manifest.publisher?.namespace) {
		errors.push('publisher.id and publisher.namespace are required.');
	}
	const cultures = new Set(manifest.localization?.supportedCultures ?? []);
	if (!cultures.has('zh-CN') || !cultures.has('en-US')) {
		errors.push('localization.supportedCultures must include zh-CN and en-US.');
	}
	if (!manifest.signing?.fingerprint || !/^[A-Fa-f0-9]{40}$/.test(manifest.signing.fingerprint)) {
		errors.push('signing.fingerprint must be a 40-character OpenPGP fingerprint placeholder or publisher fingerprint.');
	}
	return errors;
}
