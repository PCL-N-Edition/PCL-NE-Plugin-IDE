/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Community Edition does not download or ship Copilot VSIX packages.
 * This script is a no-op so residual Azure Pipeline steps fail closed without failing the job.
 */
console.log('downloadCopilotVsix: skipped (Community Edition does not ship Copilot).');
process.exit(0);
