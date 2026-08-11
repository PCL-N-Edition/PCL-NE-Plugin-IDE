/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';

export const NPLUG_EXTENSION = '.nplug';
export const SLNX_EXTENSION = '.slnx';
export const CSPROJ_EXTENSION = '.csproj';

/** On-disk project marker for Community Plugin projects. */
export interface NplugDocument {
	schemaVersion: '1.0';
	kind: 'pcl-plugin';
	id: string;
	name: string;
	version: string;
	sdkVersion: string;
	author?: string;
	description?: string;
	project: string;
	solution?: string;
	manifest?: string;
	entry: {
		assembly: string;
		type: string;
	};
}

export function isNplugPath(filePath: string): boolean {
	return filePath.toLowerCase().endsWith(NPLUG_EXTENSION);
}

export function isSlnxPath(filePath: string): boolean {
	return filePath.toLowerCase().endsWith(SLNX_EXTENSION);
}

export function isCsprojPath(filePath: string): boolean {
	return filePath.toLowerCase().endsWith(CSPROJ_EXTENSION);
}

export function readNplug(filePath: string): NplugDocument {
	const raw = fs.readFileSync(filePath, 'utf8');
	const parsed = JSON.parse(raw) as NplugDocument;
	if (parsed.schemaVersion !== '1.0' || parsed.kind !== 'pcl-plugin') {
		throw new Error(`Invalid .nplug schema in ${filePath}`);
	}
	return parsed;
}

export function writeNplug(filePath: string, doc: NplugDocument): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(doc, null, '\t') + '\n', 'utf8');
}

export function findNplugInDirectory(dir: string): string | undefined {
	if (!fs.existsSync(dir)) {
		return undefined;
	}
	try {
		const entries = fs.readdirSync(dir);
		const match = entries.find(name => name.toLowerCase().endsWith(NPLUG_EXTENSION));
		return match ? path.join(dir, match) : undefined;
	} catch {
		return undefined;
	}
}

export function findCsprojInDirectory(dir: string): string | undefined {
	if (!fs.existsSync(dir)) {
		return undefined;
	}
	try {
		const entries = fs.readdirSync(dir);
		const match = entries.find(name => name.toLowerCase().endsWith(CSPROJ_EXTENSION));
		return match ? path.join(dir, match) : undefined;
	} catch {
		return undefined;
	}
}

export function findSlnxInDirectory(dir: string): string | undefined {
	if (!fs.existsSync(dir)) {
		return undefined;
	}
	try {
		const entries = fs.readdirSync(dir);
		const match = entries.find(name => name.toLowerCase().endsWith(SLNX_EXTENSION));
		return match ? path.join(dir, match) : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Resolve the folder that should become the workspace root for a selected project file.
 */
export function resolveProjectRootFromFile(selectedPath: string): string {
	const ext = path.extname(selectedPath).toLowerCase();
	if (ext === NPLUG_EXTENSION || ext === SLNX_EXTENSION || ext === CSPROJ_EXTENSION) {
		return path.dirname(selectedPath);
	}
	// If a folder path is passed in, use it directly.
	if (fs.existsSync(selectedPath) && fs.statSync(selectedPath).isDirectory()) {
		return selectedPath;
	}
	return path.dirname(selectedPath);
}

export function buildNplugFromParts(options: {
	id: string;
	name: string;
	version?: string;
	sdkVersion: string;
	author?: string;
	description?: string;
	assemblyName: string;
	projectFileName: string;
	solutionFileName: string;
}): NplugDocument {
	return {
		schemaVersion: '1.0',
		kind: 'pcl-plugin',
		id: options.id,
		name: options.name,
		version: options.version ?? '0.1.0',
		sdkVersion: options.sdkVersion,
		author: options.author,
		description: options.description,
		project: options.projectFileName,
		solution: options.solutionFileName,
		manifest: 'plugin.json',
		entry: {
			assembly: `lib/net10.0/${options.assemblyName}.dll`,
			type: `${options.assemblyName}.HelloPlugin`,
		},
	};
}
