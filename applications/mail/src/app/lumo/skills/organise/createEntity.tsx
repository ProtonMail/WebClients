import { useEffect, useId } from 'react';

import { c } from 'ttag';

import ParentFolderSelector from '@proton/components/containers/labels/ParentFolderSelector';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';
import { IcTagPlus } from '@proton/icons/icons/IcTagPlus';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type {
    ActionRequest,
    ReferenceLabels,
    ToolDefinition,
    ToolHandler,
} from '@proton/llm/lib/lumoAgent/contracts/types';
import TextFieldBody from '@proton/llm/lib/lumoAgent/ui/cardBodies/TextFieldBody';
import type { CardBodyProps, CardReferences, CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAX_FOLDER_NESTING_LEVEL, ROOT_FOLDER } from '@proton/shared/lib/constants';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import { assertNotDefaultFolder } from '../../helpers/defaultFolders';
import { resolveTypedId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

export interface CreateEntityParams {
    name: string;
    /** `create_folder` only — a label takes no parent. */
    parentId?: string | null;
}

/**
 * The only mutation result the model consumes: both fields come from the entity the SERVER returned, which
 * normalises the name — so they name something that exists, and the model can chain "create a folder, then
 * move mail into it" without re-reading list_folders.
 */
export interface CreatedEntityResult {
    reference: string;
    name: string;
    /**
     * The card can swap the model's parent for one the model never named, so the result names it; otherwise
     * the model sees only a bare reference and its reply leaks the handle or names the wrong folder.
     */
    parent?: { reference: string; name: string };
}

type EntityKind = 'folder' | 'label';

const ENTITY_DEFAULTS: Record<EntityKind, { Type: LABEL_TYPE; Notify: number }> = {
    folder: { Type: LABEL_TYPE.MESSAGE_FOLDER, Notify: 1 },
    label: { Type: LABEL_TYPE.MESSAGE_LABEL, Notify: 0 },
};

/**
 * A name is free text that can be shaped exactly like a reference — "e-ticket" matches
 * `<kind>-<6 base36>` — so the hallucination guard would reject the call outright. `parentId` stays
 * guarded, which is what keeps this safe.
 */
const FREE_TEXT_PARAMS = ['name'] as const;

const ancestorCount = (folderID: string, folders: Folder[]): number => {
    const parentIdOf = new Map(folders.map((folder) => [folder.ID, folder.ParentID]));
    let ancestors = 0;
    let ancestorId = parentIdOf.get(folderID);
    // Bounded by the folder count rather than trusting the chain to terminate.
    while (ancestorId && ancestors < folders.length) {
        ancestors += 1;
        ancestorId = parentIdOf.get(String(ancestorId));
    }
    return ancestors;
};

/** Whether ParentFolderSelector offers the folder: it exists and sits above the nesting limit. */
const isOfferedParent = (folderID: string, folders: Folder[]): boolean => {
    return (
        folders.some((folder) => folder.ID === folderID) && ancestorCount(folderID, folders) < MAX_FOLDER_NESTING_LEVEL
    );
};

/**
 * The app's own parent picker never offers a folder this deep — ParentFolderSelector drops options at
 * `level >= MAX_FOLDER_NESTING_LEVEL` — so the API rejects the nesting the model proposed. Without this the
 * user confirms a folder that is then never created, and the model is told only "the tool failed".
 */
const assertParentCanNest = (parentFolderID: string, folders: Folder[]) => {
    if (ancestorCount(parentFolderID, folders) < MAX_FOLDER_NESTING_LEVEL) {
        return;
    }
    const parentName = folders.find((folder) => folder.ID === parentFolderID)?.Name ?? parentFolderID;
    throw new ToolInputError(
        `Folders nest at most ${MAX_FOLDER_NESTING_LEVEL} levels deep, and "${parentName}" is already at that depth, so nothing can be created inside it. Nest under one of its ancestors instead, or pass \`parentId\`: null for a top-level folder.`
    );
};

/** Both entities are created through the same `createLabel` endpoint; {@link ENTITY_DEFAULTS} is what differs. */
const createEntityHandler =
    (kind: EntityKind) =>
    (mail: MailToolDeps): ToolHandler<CreateEntityParams, CreatedEntityResult> =>
    async ({ name, parentId }, { references }) => {
        const parentFolderID = parentId ? resolveTypedId(parentId, ['folder'], references) : undefined;
        const folders = mail.getFolders();
        if (parentFolderID) {
            assertParentCanNest(parentFolderID, folders);
        }
        const parentName = folders.find((folder) => folder.ID === parentFolderID)?.Name;
        const created = await mail.createLabel({
            label: {
                Name: name,
                Color: getRandomAccentColor(),
                ...ENTITY_DEFAULTS[kind],
                ...(parentFolderID ? { ParentID: parentFolderID } : {}),
            },
        });

        return {
            reference: references.referenceFor(kind, created.ID, { title: created.Name }),
            name: created.Name,
            ...(parentId && parentName ? { parent: { reference: parentId, name: parentName } } : {}),
        };
    };

const serializeCreated =
    (kind: EntityKind) =>
    ({ reference, name, parent }: CreatedEntityResult): string =>
        parent
            ? `Created ${kind} ${reference} | "${name}" inside folder ${parent.reference} | "${parent.name}".`
            : `Created ${kind} ${reference} | "${name}".`;

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
    freeTextParams: FREE_TEXT_PARAMS,
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
    checkParams: ({ parentId }) => {
        if (parentId) {
            assertNotDefaultFolder(parentId, 'hold folders of their own');
        }
    },
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
    freeTextParams: FREE_TEXT_PARAMS,
    examples: [
        {
            context: 'The user asks for a Receipts tag so they can label their invoices with it.',
            call: { name: 'Receipts' },
        },
    ],
    serializeForLumo: serializeCreated('label'),
    summarizeChip: () => ({ label: c('Info').t`Create label` }),
};

const entityName = (source: Record<string, any>): string => String(source.name ?? '');

/** An emptied field would create an unnamed entity the backend rejects, reaching the model only as a failure. */
const hasName = (params: Record<string, any>): boolean => entityName(params).trim().length > 0;

/**
 * The parent's name is read straight out of `labels`, not through `referenceName`: `list_folders` mints a
 * parent reference without a name, so a parent outside its own results has none recorded — and showing
 * "Hotels in folder-x7b2q1" is worse than dropping the clause.
 */
const describeEntity = (action: ActionRequest, labels: ReferenceLabels): string | undefined => {
    const name = entityName(action);
    if (!name) {
        return undefined;
    }
    const parentName = labels[String(action.parentId)]?.title;
    if (!parentName) {
        return name;
    }

    // translator: a new folder's name followed by the folder it will be nested inside, e.g. "Hotels in Travel"
    return c('Info').t`${name} in ${parentName}`;
};

const renderNameField = (label: string, { params, onChange }: CardBodyProps) => {
    return (
        <TextFieldBody label={label} value={entityName(params)} onChange={(name) => onChange({ ...params, name })} />
    );
};

interface FolderLocationFieldProps extends Pick<CardBodyProps, 'params' | 'onChange'> {
    references: CardReferences;
}

/**
 * The same picker Settings shows, preselected on the model's proposed parent. A pick is minted as a
 * reference with its name, so the handler stays the only path to the API and the settled tile names it.
 */
const FolderLocationField = ({ params, onChange, references }: FolderLocationFieldProps) => {
    const [folders = [], loadingFolders] = useFolders();
    const id = useId();
    const proposedID = params.parentId ? references.idFor(params.parentId) : undefined;
    const offered = proposedID !== undefined && isOfferedParent(proposedID, folders);

    // A parent the picker cannot show (too deep, deleted, not a folder) would display as blank yet still be
    // sent, so the card drops it and Confirm applies the "No parent folder" it shows.
    useEffect(() => {
        if (!loadingFolders && params.parentId && !offered) {
            onChange({ ...params, parentId: null });
        }
    }, [loadingFolders, offered, params, onChange]);

    const value = offered ? proposedID : ROOT_FOLDER;

    const handleChange = (parentID: string | number) => {
        if (parentID === ROOT_FOLDER) {
            onChange({ ...params, parentId: null });
            return;
        }
        const folder = folders.find(({ ID }) => ID === parentID);
        onChange({
            ...params,
            parentId: references.referenceFor('folder', String(parentID), folder && { title: folder.Name }),
        });
    };

    return (
        <ParentFolderSelector
            id={id}
            label={c('Label').t`Folder location`}
            value={value}
            onChange={handleChange}
            disableOptions={[]}
            maxLevel={MAX_FOLDER_NESTING_LEVEL}
        />
    );
};

/** `sentence` is a thunk because its `ttag` string must resolve at render time, not here. */
const entityCardRenderer = (
    icon: CardRenderer['icon'],
    sentence: () => string,
    renderBody: CardRenderer['renderBody']
): CardRenderer => ({
    icon,
    sentence,
    renderBody,
    canApply: hasName,
    detail: describeEntity,
});

export const createFolderCardRenderer = entityCardRenderer(
    IcFolderPlus,
    // translator: the name is the field below, so the sentence names only the kind of thing being made
    () => c('Info').t`Create a folder`,
    (props) => {
        const nameField = renderNameField(c('Label').t`Folder name`, props);
        if (!props.references) {
            return nameField;
        }
        return (
            <div className="flex flex-column gap-2">
                {nameField}
                <FolderLocationField params={props.params} onChange={props.onChange} references={props.references} />
            </div>
        );
    }
);

const createLabelCardRenderer = entityCardRenderer(
    IcTagPlus,
    // translator: the name is the field below, so the sentence names only the kind of thing being made
    () => c('Info').t`Create a label`,
    (props) => {
        return renderNameField(c('Label').t`Label name`, props);
    }
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
