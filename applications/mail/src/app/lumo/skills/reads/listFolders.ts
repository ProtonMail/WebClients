import { c, msgid } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { serializeCatalogue } from './catalogue';

export interface FolderSummary {
    reference: string;
    name: string;
    /** Parent folder reference, or null for a top-level folder. */
    parent: string | null;
}

export interface ListFoldersResult {
    folders: FolderSummary[];
}

export const listFoldersDefinition: ToolDefinition<Record<string, never>, ListFoldersResult> = {
    name: 'list_folders',
    kind: 'read',
    toolDescription:
        "List the user's custom folders — each with its folder-… reference, name, and parent folder reference (or top-level). Use to resolve a folder the user names into a folder-… reference before moving mail or nesting a new folder, or to check whether a folder already exists (a filter can only file into a folder that already exists). Read-only.",
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) =>
        serializeCatalogue(
            `${result.folders.length} folders:`,
            result.folders.map((folder) =>
                folder.parent
                    ? `${folder.reference} | "${folder.name}" | parent: ${folder.parent}`
                    : `${folder.reference} | "${folder.name}" | top-level`
            ),
            'The user has no custom folders.'
        ),
    summarizeChip: (_params, result) => {
        const count = result.folders.length;
        return { label: c('Info').ngettext(msgid`Read your ${count} folder`, `Read your ${count} folders`, count) };
    },
};

export const createListFoldersHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ListFoldersResult> =>
    async (_params, { references }) => ({
        folders: mail.getFolders().map((folder) => ({
            reference: references.referenceFor('folder', folder.ID, { title: folder.Name }),
            name: folder.Name,
            parent: folder.ParentID ? references.referenceFor('folder', String(folder.ParentID)) : null,
        })),
    });

export const listFoldersModule: MailToolModule = {
    definition: listFoldersDefinition,
    createHandler: createListFoldersHandler,
};
