import { c } from 'ttag';

import TextFieldBody from '@proton/components/components/lumoAgent/cardBodies/TextFieldBody';
import type { CardBodyProps, CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type {
    ActionRequest,
    ReferenceLabels,
    ToolDefinition,
    ToolHandler,
} from '@proton/llm/lib/lumoAgent/contracts/types';

import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { referenceName } from './emailSelection';

export interface RenameFolderParams {
    folder: string;
    name: string;
}

export const renameFolderDefinition: ToolDefinition<RenameFolderParams, void> = {
    name: 'rename_folder',
    kind: 'mutation',
    toolDescription:
        'Rename an existing custom folder. `folder` is a folder-… reference from list_folders; `name` is the new name. Use for "rename folder X to Y". This changes only the name — no mail moves, the folder keeps its colour, notifications and parent folder, and everything filed in it stays there. list_folders shows each folder\'s current name: if the folder the user means is already called what they are asking for, tell them there is nothing to do instead of proposing this. Proposed to the user for confirmation before it runs. Example: { "folder": "folder-x7b2q1", "name": "Trips" }.',
    // `name` is the user's own words: "family-photos" is reference-shaped, so the engine's hallucination
    // guard would reject it as a reference no read ever returned.
    freeTextParams: ['name'],
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['folder', 'name'],
        properties: { folder: { type: 'string' }, name: { type: 'string' } },
    },
    examples: [
        {
            context:
                'list_folders returned `folder-x7b2q1 | "Travel" | top-level` and the user asks to rename it to Trips.',
            call: { folder: 'folder-x7b2q1', name: 'Trips' },
        },
    ],
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Rename folder` }),
};

/**
 * `updateLabel` replaces the folder rather than patching it, so the rename sends the whole existing
 * folder with only `Name` overridden — the same shape `ToggleNotify` uses. Hand-listing the fields to
 * re-send instead would silently reset whichever one was forgotten.
 */
export const createRenameFolderHandler =
    (mail: MailToolDeps): ToolHandler<RenameFolderParams, void> =>
    async ({ folder, name }, { references }) => {
        const id = resolveTypedId(folder, ['folder'], references);
        const existing = mail.getFolders().find((candidate) => candidate.ID === id);
        if (!existing) {
            throw new ToolInputError(
                `Folder ${folder} no longer exists. Call list_folders again for the folders that do.`
            );
        }

        await mail.updateLabel({ labelID: existing.ID, label: { ...existing, Name: name.trim() } });
    };

const newName = (source: ActionRequest | Record<string, any>): string => String(source.name ?? '');

const currentFolderName = (action: ActionRequest, labels: ReferenceLabels): string =>
    referenceName(action.folder, labels);

const renameFolderCardRenderer: CardRenderer = {
    icon: IcPencil,
    title: () => c('Title').t`Rename folder`,
    subtitle: currentFolderName,
    renderBody: ({ params, onChange }: CardBodyProps) => (
        <TextFieldBody
            label={c('Label').t`New name`}
            value={newName(params)}
            onChange={(name) => onChange({ ...params, name })}
        />
    ),
    canApply: (params) => newName(params).trim().length > 0,
    // The settled tile is handed the params that ran, so this names what was applied, not what was offered.
    detail: (action, labels) => `${currentFolderName(action, labels)} → ${newName(action)}`,
};

export const renameFolderModule: MailToolModule = {
    definition: renameFolderDefinition,
    createHandler: createRenameFolderHandler,
    cardRenderer: renameFolderCardRenderer,
};
