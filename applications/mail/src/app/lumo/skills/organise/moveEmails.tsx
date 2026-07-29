import { c, msgid } from 'ttag';

import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';
import type { ActionRequest, ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MoveItemsCard } from '@proton/lumo-ui';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';

import { resolveElements, resolveId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

/** The three reversible system locations move_emails can send mail to. NOT deletion: mail in
 *  Trash/Archive/Spam can be moved back. Permanent delete is deliberately absent (no tool covers it). */
export const MOVE_LOCATIONS = ['trash', 'archive', 'spam'] as const;

export type MoveLocation = (typeof MOVE_LOCATIONS)[number];

/** Trash/Archive/Spam are system labels (not in list_folders), so they map here rather than a folder reference. */
const MOVE_LOCATION_LABEL_IDS: Record<MoveLocation, MAILBOX_LABEL_IDS> = {
    trash: MAILBOX_LABEL_IDS.TRASH,
    archive: MAILBOX_LABEL_IDS.ARCHIVE,
    spam: MAILBOX_LABEL_IDS.SPAM,
};

export interface MoveEmailsParams {
    ids: string[];
    /** A folder-… reference from list_folders, or null when moving to a system `location`. */
    folder: string | null;
    /** A reversible system location ("trash" | "archive" | "spam"), or null when moving to a `folder`. */
    location: string | null;
}

/**
 * Validate move_emails' destination: EXACTLY ONE of `folder` (a custom folder reference) or `location`
 * (a reversible system location) must be set, and `location` (when used) must be one of
 * {@link MOVE_LOCATIONS}. Pure — mirrors {@link resolveOpenFolderTarget} — so the handler can enforce
 * the rule before touching the store; a violation throws a self-correcting Error the engine feeds back
 * to the model.
 */
export const resolveMoveTarget = (
    params: Pick<MoveEmailsParams, 'folder' | 'location'>
): { location: MoveLocation } | { folder: string } => {
    const { folder, location } = params;
    // (folder == null) === (location == null) is true when BOTH are null or BOTH are set.
    if ((folder == null) === (location == null)) {
        throw new Error(
            'move_emails needs EXACTLY ONE of `folder` (a custom folder reference) or `location` (a system location: trash, archive or spam): set one and leave the other null.'
        );
    }
    if (location != null) {
        if (!(MOVE_LOCATIONS as readonly string[]).includes(location)) {
            throw new Error(
                `Unknown location "${location}". Valid locations are: ${MOVE_LOCATIONS.join(
                    ', '
                )}. To move into a custom folder, pass its folder-… reference as \`folder\` instead.`
            );
        }
        return { location: location as MoveLocation };
    }
    return { folder: folder as string };
};

export const moveEmailsDefinition: ToolDefinition<MoveEmailsParams, void> = {
    name: 'move_emails',
    kind: 'mutation',
    toolDescription:
        'Move one or more emails to a folder OR to a system location. `ids` are email-… references from view_emails/search. Pass EXACTLY ONE destination: set `folder` to a folder-… reference from list_folders (and leave `location` null) to file into a custom folder; OR set `location` to one of "trash" (use this for "delete"/"bin"/"remove these" — it is reversible, NOT a permanent delete), "archive", or "spam" (and leave `folder` null). Folders and these locations are exclusive, so this removes the emails from where they currently live. To add a tag WITHOUT moving, use apply_labels instead. Proposed to the user for confirmation before it runs. Examples: into Travel → { "ids": ["email-a1b2c3"], "folder": "folder-x7b2q1", "location": null }; to Trash → { "ids": ["email-a1b2c3"], "folder": null, "location": "trash" }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['ids', 'folder', 'location'],
        properties: {
            ids: { type: 'array', items: { type: 'string' } },
            folder: { type: ['string', 'null'] },
            location: { type: ['string', 'null'] },
        },
    },
    examples: [
        {
            context:
                'search returned email-a1b2c3 and email-d4e5f6, and list_folders returned `folder-x7b2q1 | "Travel"`. Move both emails into Travel.',
            call: { ids: ['email-a1b2c3', 'email-d4e5f6'], folder: 'folder-x7b2q1', location: null },
        },
        {
            context:
                'search returned email-a1b2c3 and the user asks to delete (bin) it. "Delete" means a reversible move to Trash — there is no permanent delete.',
            call: { ids: ['email-a1b2c3'], folder: null, location: 'trash' },
        },
    ],
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Move emails` }),
};

export const createMoveEmailsHandler =
    (mail: MailToolDeps): ToolHandler<MoveEmailsParams, void> =>
    async ({ ids, folder, location }, { references }) => {
        const elements = resolveElements(mail.store, ids, references);
        // EXACTLY-ONE / known-location enforcement lives in the pure resolver (shared with the schema): a
        // system location maps to its label id; a custom folder resolves its reference.
        const resolved = resolveMoveTarget({ folder, location });
        const destinationLabelID =
            'location' in resolved
                ? MOVE_LOCATION_LABEL_IDS[resolved.location]
                : resolveId(resolved.folder, references);
        await mail.applyLocation({ type: APPLY_LOCATION_TYPES.MOVE, elements, destinationLabelID });
    };

const moveLocationLabel = (location: string): string => {
    switch (location) {
        case 'trash':
            return c('Label').t`Trash`;
        case 'archive':
            return c('Label').t`Archive`;
        case 'spam':
            return c('Label').t`Spam`;
        default:
            return location;
    }
};

/** The destination's human name — a folder's name (from the reference's recorded label) or a system location. */
const moveTargetName = (action: ActionRequest, labels: Record<string, string>): string => {
    if (action.folder) {
        return labels[action.folder as string] ?? String(action.folder);
    }
    if (action.location) {
        return moveLocationLabel(String(action.location));
    }
    return '';
};

/**
 * The confirm card + result tile for move_emails: the shared {@link MoveItemsCard} lets the user
 * deselect emails before applying (editing `params.ids`), while the destination shows as the shell's
 * subtitle. The full proposed set (`action.ids`) stays visible so a deselected row can be re-ticked.
 */
export const moveEmailsCardRenderer: CardRenderer = {
    icon: IcFolderArrowIn,
    title: () => c('Title').t`Move emails`,
    subtitle: (action, labels) => {
        const dest = moveTargetName(action, labels);
        return dest ? `→ ${dest}` : undefined;
    },
    renderBody: ({ action, params, labels, onChange }) => {
        const proposedIds = (action.ids as string[]) ?? [];
        const selectedIds = (params.ids as string[]) ?? [];
        return (
            <MoveItemsCard
                items={proposedIds.map((id) => ({ id, label: labels[id] ?? id }))}
                selectedIds={selectedIds}
                onToggle={(id, checked) =>
                    onChange({ ...params, ids: checked ? [...selectedIds, id] : selectedIds.filter((x) => x !== id) })
                }
            />
        );
    },
    detail: (action, labels) => {
        const count = ((action.ids as string[]) ?? []).length;
        const dest = moveTargetName(action, labels);
        return c('Info').ngettext(msgid`${count} email → ${dest}`, `${count} emails → ${dest}`, count);
    },
};

export const moveEmailsModule: MailToolModule = {
    definition: moveEmailsDefinition,
    createHandler: createMoveEmailsHandler,
    cardRenderer: moveEmailsCardRenderer,
};
