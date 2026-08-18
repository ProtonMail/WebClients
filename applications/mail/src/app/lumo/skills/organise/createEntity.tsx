import { c } from 'ttag';

import TextFieldBody from '@proton/components/components/lumoAgent/cardBodies/TextFieldBody';
import type { CardBodyProps, CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';
import { IcTagPlus } from '@proton/icons/icons/IcTagPlus';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE } from '@proton/shared/lib/constants';

import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

export interface CreateEntityParams {
    name: string;
    /** `create_folder` only: a folder-… reference to nest under, or null for a top-level folder. */
    parentId?: string | null;
}

/**
 * The only mutation result the model consumes: `reference` is minted from the entity the SERVER returned,
 * so the model can chain "create a folder, then move mail into it" without re-reading list_folders.
 */
export interface CreatedEntityResult {
    reference: string;
    name: string;
}

type EntityKind = 'folder' | 'label';

const ENTITY_LABEL_TYPES: Record<EntityKind, LABEL_TYPE> = {
    folder: LABEL_TYPE.MESSAGE_FOLDER,
    label: LABEL_TYPE.MESSAGE_LABEL,
};

/**
 * A folder name is free text that can be shaped exactly like a reference — "e-ticket" matches
 * `<kind>-<6 base36>` — so the hallucination guard would reject the call outright. `parentId` stays
 * guarded, which is what keeps this safe.
 */
const NAME_IS_FREE_TEXT = ['name'] as const;

/** Both entities are created through the same `createLabel` endpoint, differing only in `Type`. */
const createEntityHandler =
    (kind: EntityKind) =>
    (mail: MailToolDeps): ToolHandler<CreateEntityParams, CreatedEntityResult> =>
    async ({ name, parentId }, { references }) => {
        const parentFolderID = parentId ? resolveTypedId(parentId, ['folder'], references) : undefined;
        const created = await mail.createLabel({
            label: {
                Name: name,
                Color: getRandomAccentColor(),
                Type: ENTITY_LABEL_TYPES[kind],
                ...(kind === 'folder' ? { Notify: 1 } : {}),
                ...(parentFolderID ? { ParentID: parentFolderID } : {}),
            },
        });

        return { reference: references.referenceFor(kind, created.ID, created.Name), name: created.Name };
    };

/** The server normalises the name, so what is reported back is what was actually created. */
const serializeCreated =
    (kind: EntityKind) =>
    ({ reference, name }: CreatedEntityResult): string =>
        `Created ${kind} ${reference} | "${name}".`;

export const createFolderDefinition: ToolDefinition<CreateEntityParams, CreatedEntityResult> = {
    name: 'create_folder',
    kind: 'mutation',
    toolDescription:
        'Create a new folder, optionally nested under an existing one. `name` is the new folder\'s name; `parentId` is a folder-… reference from list_folders to nest under, or null for a top-level folder. Use before moving mail into a folder that does not exist yet: the result carries the new folder\'s folder-… reference, which move_emails takes directly, so no further read is needed. Folders are exclusive containers — mail lives in exactly one; for an additive tag that leaves mail where it is, use create_label. This organises mail you move yourself; for a rule that files incoming mail automatically, use create_filter. Proposed to the user for confirmation before it runs. Example: { "name": "Hotels", "parentId": null }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'parentId'],
        properties: { name: { type: 'string' }, parentId: { type: ['string', 'null'] } },
    },
    freeTextParams: NAME_IS_FREE_TEXT,
    examples: [
        {
            context: 'The user asks for a new top-level folder for their hotel bookings.',
            call: { name: 'Hotels', parentId: null },
        },
        {
            context: 'list_folders returned `folder-x7b2q1 | "Travel"` and the user wants Hotels inside it.',
            call: { name: 'Hotels', parentId: 'folder-x7b2q1' },
        },
    ],
    serializeForLumo: serializeCreated('folder'),
    summarizeChip: () => ({ label: c('Info').t`Create folder` }),
};

export const createLabelDefinition: ToolDefinition<CreateEntityParams, CreatedEntityResult> = {
    name: 'create_label',
    kind: 'mutation',
    toolDescription:
        'Create a new label, whose colour is assigned automatically. `name` is the new label\'s name. Use when the user wants a tag that does not exist yet: the result carries the new label\'s label-… reference, which apply_labels takes directly, so no further read is needed. A label is an additive tag and leaves mail where it is; for an exclusive container that mail is moved into, use create_folder. This tags mail you apply it to; for a rule that tags incoming mail automatically, use create_filter. Proposed to the user for confirmation before it runs. Example: { "name": "Receipts" }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: { name: { type: 'string' } },
    },
    freeTextParams: NAME_IS_FREE_TEXT,
    examples: [
        {
            context: 'The user asks for a Receipts tag so they can label their invoices with it.',
            call: { name: 'Receipts' },
        },
    ],
    serializeForLumo: serializeCreated('label'),
    summarizeChip: () => ({ label: c('Info').t`Create label` }),
};

const entityName = (params: Record<string, any>): string => String(params.name ?? '');

/** An emptied field would create an unnamed entity the backend rejects, reaching the model only as a failure. */
const hasName = (params: Record<string, any>): boolean => entityName(params).trim().length > 0;

/** `title` and `fieldLabel` are thunks because their `ttag` strings must resolve at render time, not here. */
const entityCardRenderer = (
    icon: CardRenderer['icon'],
    title: () => string,
    fieldLabel: () => string
): CardRenderer => ({
    icon,
    title,
    subtitle: (action) => entityName(action) || undefined,
    renderBody: ({ params, onChange }: CardBodyProps) => (
        <TextFieldBody
            label={fieldLabel()}
            value={entityName(params)}
            onChange={(name) => onChange({ ...params, name })}
        />
    ),
    canApply: hasName,
    detail: (action) => entityName(action) || undefined,
});

export const createFolderCardRenderer = entityCardRenderer(
    IcFolderPlus,
    () => c('Title').t`Create folder`,
    () => c('Label').t`Folder name`
);

export const createLabelCardRenderer = entityCardRenderer(
    IcTagPlus,
    () => c('Title').t`Create label`,
    () => c('Label').t`Label name`
);

export const createFolderModule: MailToolModule = {
    definition: createFolderDefinition,
    createHandler: createEntityHandler('folder'),
    cardRenderer: createFolderCardRenderer,
};

export const createLabelModule: MailToolModule = {
    definition: createLabelDefinition,
    createHandler: createEntityHandler('label'),
    cardRenderer: createLabelCardRenderer,
};
