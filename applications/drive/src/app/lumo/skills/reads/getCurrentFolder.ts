import { c } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import { getFolderSnapshot } from '../../../sections/folders';
import { type OtherDriveSection, describeDriveSection, getOtherDriveSection, isFolderRoute } from '../../driveSection';
import type { DriveToolDeps, DriveToolModule } from '../../toolModule';

/**
 * Which folder the user is browsing and its shape (name, item counts) — context for when they refer to
 * "this folder" or "here", never names, sizes or contents. Covers the file browser only — My files, and
 * a folder opened from Shared with me. Elsewhere in Drive it reports which section that is instead, so
 * the assistant can name it rather than speaking vaguely.
 */

const MAX_FOLDER_NAME_LENGTH = 200;

const sanitizeFolderName = (name: string) => {
    const singleLine = name.replace(/[\r\n]+/g, ' ').trim();
    return singleLine.length > MAX_FOLDER_NAME_LENGTH ? `${singleLine.slice(0, MAX_FOLDER_NAME_LENGTH)}…` : singleLine;
};

export interface CurrentFolderResult {
    /** Absent when the folder browser is not what the user is looking at, or still loading. */
    folder?: { name: string; isRoot: boolean; fileCount: number; folderCount: number };
    isLoading: boolean;
    /** Which other part of Drive the user is on, when it is not the folder browser. */
    section?: OtherDriveSection;
}

const describeFolder = (folder: { name: string; isRoot: boolean }) => {
    const name = sanitizeFolderName(folder.name);
    return folder.isRoot ? `the root of their Drive ("${name}")` : `the folder "${name}"`;
};

export const getCurrentFolderDefinition: ToolDefinition<Record<string, never>, CurrentFolderResult> = {
    name: 'get_current_folder',
    kind: 'read',
    toolDescription:
        'Tells you which folder the user is currently browsing in Proton Drive and how many files and folders it holds — never names, sizes, dates or contents. Use it to know where the user is when they refer to "this folder", "here", or their current location. It cannot list, search or read individual files, so never guess a file\'s name or contents from the counts.',
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) => {
        if (!result.folder) {
            if (result.section) {
                return `The user is currently looking at ${describeDriveSection(result.section)}, which this chat cannot read. Tell them that in one short line and move on.`;
            }
            return result.isLoading
                ? 'The user is browsing a folder, but it is still loading. Tell them that in one short line and move on.'
                : 'The user is not in their file browser, and no other part of Drive can be read from this chat yet. Tell them that in one short line and move on.';
        }

        const where = describeFolder(result.folder);
        const { fileCount, folderCount } = result.folder;
        if (!fileCount && !folderCount) {
            return result.isLoading
                ? `The user is browsing ${where}, and its contents are still loading.`
                : `The user is browsing ${where}. It is empty.`;
        }

        const parts = [
            fileCount ? `${fileCount} file${fileCount === 1 ? '' : 's'}` : '',
            folderCount ? `${folderCount} folder${folderCount === 1 ? '' : 's'}` : '',
        ].filter(Boolean);
        const summary = `The user is browsing ${where}, which holds ${parts.join(' and ')}.`;
        return result.isLoading ? `${summary} It is still loading, so the count may change.` : summary;
    },
    summarizeChip: (_params, result) => {
        let label = c('Info').t`Not in My files`;
        if (result.folder) {
            label = c('Info').t`Read folder context`;
        } else if (result.isLoading) {
            label = c('Info').t`Loading folder`;
        }
        return { label };
    },
};

export const createGetCurrentFolderHandler =
    (drive: DriveToolDeps): ToolHandler<Record<string, never>, CurrentFolderResult> =>
    async () => {
        const pathname = drive.getPathname();
        if (!isFolderRoute(pathname)) {
            return { isLoading: false, section: getOtherDriveSection(pathname) };
        }

        const { folder, fileCount, folderCount, isLoading } = getFolderSnapshot();
        if (!folder) {
            return { isLoading };
        }

        return {
            folder: { ...folder, fileCount, folderCount },
            isLoading,
        };
    };

export const getCurrentFolderModule: DriveToolModule = {
    definition: getCurrentFolderDefinition,
    createHandler: createGetCurrentFolderHandler,
};
