/*---------------------------------------------------------------------------------------------
 *  Copyright (c) PCL-N Edition contributors. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { findCsprojInDirectory } from './nplug';
import { tryLoadProjects } from './project';

interface PclTaskDefinition extends vscode.TaskDefinition {
	task: 'restore' | 'build' | 'package' | 'validate' | 'sign';
	projectRoot?: string;
}

export class PclTaskProvider implements vscode.TaskProvider {
	provideTasks(): vscode.Task[] {
		const tasks: vscode.Task[] = [];
		for (const project of tryLoadProjects(vscode.workspace.workspaceFolders)) {
			for (const task of ['restore', 'build', 'package', 'validate', 'sign'] as const) {
				const created = this.createTask({ type: 'pcl', task, projectRoot: project.root });
				if (created) {
					tasks.push(created);
				}
			}
		}
		return tasks;
	}

	resolveTask(task: vscode.Task): vscode.Task | undefined {
		return this.createTask(task.definition as PclTaskDefinition);
	}

	private createTask(definition: PclTaskDefinition): vscode.Task | undefined {
		const projectRoot = definition.projectRoot ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!projectRoot) {
			return undefined;
		}
		const project = findCsprojInDirectory(projectRoot);
		if (!project) {
			return undefined;
		}
		const dotnet = vscode.workspace.getConfiguration('pcl.community').get<string>('dotnetPath') || 'dotnet';
		const args = definition.task === 'restore'
			? ['restore', project]
			: definition.task === 'build'
				? ['build', project, '-c', 'Debug']
				: ['build', project, '-c', 'Release'];
		const execution = new vscode.ProcessExecution(dotnet, args, { cwd: projectRoot });
		const task = new vscode.Task(
			{ ...definition, projectRoot },
			vscode.TaskScope.Workspace,
			`PCL: ${definition.task}`,
			'PCL Community',
			execution,
			['$msCompile', '$pcl-analyzer'],
		);
		task.group = definition.task === 'build' ? vscode.TaskGroup.Build : undefined;
		return task;
	}
}
