import { c, msgid } from 'ttag';

import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import sentenceValue from '@proton/lumo-ui/shared-components/sentenceValue/sentenceValue';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { hasLabel } from '../../../helpers/elements';
import { APPLY_LOCATION_TYPES } from '../../../hooks/actions/applyLocation/interface';
import type { Element } from '../../../models/element';
import {
    categoryScopeName,
    elementCategoryID,
    resolveCategoryLabelID,
    resolveInboxCategory,
} from '../../helpers/categories';
import { DefaultFolderReference, MOVE_DESTINATIONS, isDefaultFolderReference } from '../../helpers/defaultFolders';
import { groupByElementType, resolveFreshElements, resolveId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import {
    emailIds,
    emailSelectionSentence,
    hasEmailSelection,
    locationScopeName,
    renderEmailSelectionBody,
} from './emailSelection';

export interface MoveEmailsParams {
    ids: string[];
    /** A destination default folder (see {@link MOVE_DESTINATIONS}), or a folder-… reference from list_folders. */
    folder: string;
    /** One Inbox category tab to move into, valid only with `folder-inbox`. */
    category: string | null;
}

/** Store-free, so it refuses a destination that cannot work before the confirm card shows. */
const assertMoveDestination = ({ folder, category }: Pick<MoveEmailsParams, 'folder' | 'category'>): void => {
    if (isDefaultFolderReference(folder) && !MOVE_DESTINATIONS.includes(folder)) {
        throw new ToolInputError(
            `Emails cannot be moved to ${folder}. The default folders that take a move are ${MOVE_DESTINATIONS.join(
                ', '
            )}; any of the user's own folder-… references from list_folders also works.`
        );
    }
    resolveInboxCategory({ target: folder, category });
};

/** A tab is a place inside the Inbox, so only mail already there can change tab in one move, as in Mail. */
const assertAllInInbox = (elements: Element[]): void => {
    if (!elements.every((element) => hasLabel(element, MAILBOX_LABEL_IDS.INBOX))) {
        throw new ToolInputError(
            'Only emails already in the Inbox can move into a category tab, and some of these are elsewhere. Move them to the Inbox first (folder "folder-inbox", category null), then into the tab.'
        );
    }
};

export const moveEmailsDefinition: ToolDefinition<MoveEmailsParams, void> = {
    name: 'move_emails',
    kind: 'mutation',
    toolDescription: `Move one or more emails to a folder. \`ids\` are email-… references from any earlier result in this conversation. Set \`folder\` to the destination: one of the default folders ${MOVE_DESTINATIONS.join(
        ', '
    )} (folder-trash is what "delete"/"bin"/"remove these" means: it is reversible, NOT a permanent delete), or the user's own folder-… reference from list_folders. The other default folders (Sent, Drafts, Starred, All mail, Scheduled, Snoozed) are not destinations. A folder is exclusive, so this removes the emails from where they currently live. To move emails that are already in the Inbox into ONE category tab ("move this to Promotions"), set \`folder\` to "folder-inbox" AND \`category\` to one of the tabs the mail context lists under "Category tabs"; an email outside the Inbox must be moved to the Inbox first. Leave \`category\` null for every other move. To add a tag WITHOUT moving, use apply_labels instead. Proposed to the user for confirmation before it runs. Examples: into Travel → { "ids": ["email-a1b2c3"], "folder": "folder-x7b2q1", "category": null }; to Trash → { "ids": ["email-a1b2c3"], "folder": "folder-trash", "category": null }; back to the Inbox → { "ids": ["email-a1b2c3"], "folder": "folder-inbox", "category": null }.`,
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['ids', 'folder', 'category'],
        properties: {
            ids: { type: 'array', items: { type: 'string' } },
            folder: { type: 'string' },
            category: { type: ['string', 'null'] },
        },
    },
    examples: [
        {
            context:
                'Earlier in the conversation open_folder listed `email-a1b2c3 | Ada | Booking | 2026-10-02 | read | Inbox` and `email-d4e5f6 | Ada | Receipt | 2026-10-02 | read | Inbox`, and list_folders returned `folder-x7b2q1 | "Travel"`. The user now asks to move Ada\'s emails from today into Travel. Every reference is already in hand, so move them with no new search or list.',
            call: { ids: ['email-a1b2c3', 'email-d4e5f6'], folder: 'folder-x7b2q1', category: null },
        },
        {
            context:
                'search returned email-a1b2c3 and the user asks to delete (bin) it. "Delete" means a reversible move to Trash — there is no permanent delete.',
            call: { ids: ['email-a1b2c3'], folder: DefaultFolderReference.TRASH, category: null },
        },
        {
            context:
                'open_folder listed `email-a1b2c3 | Shop | Spring sale | 2026-10-02 | read | Inbox | tab: primary` and the user asks to move it to Promotions.',
            call: { ids: ['email-a1b2c3'], folder: DefaultFolderReference.INBOX, category: 'promotions' },
        },
    ],
    checkParams: assertMoveDestination,
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: c('Info').t`Move emails` }),
};

/** Without this the result tile reads as applied and the model reports a move that never happened. */
const nothingMovedMessage = (destination: string, denied: boolean): string => {
    if (denied) {
        return `Nothing moved: Mail does not allow moving these emails to ${destination}. Tell the user; do not propose the same move again.`;
    }
    return `Nothing moved: these emails are already in ${destination}. Tell the user; do not propose the same move again.`;
};

/** A default folder resolves like the user's own: the registry holds its fixed reference from the first turn. */
export const createMoveEmailsHandler =
    (mail: MailToolDeps): ToolHandler<MoveEmailsParams, void> =>
    async ({ ids, folder, category }, { references }) => {
        const inboxCategory = resolveInboxCategory({ target: folder, category });
        const categoryLabelID = inboxCategory && resolveCategoryLabelID(inboxCategory, mail.getActiveCategoryTabs());
        const destinationLabelID = categoryLabelID || resolveId(folder, references);
        const elements = await resolveFreshElements(mail, ids, references);
        if (categoryLabelID) {
            assertAllInInbox(elements);
        }

        const checked = groupByElementType(elements).map((group) => {
            return { group, check: mail.validateMove(group, destinationLabelID) };
        });
        const movable = checked.filter(({ check }) => {
            return check.allowedElements.length > 0;
        });
        if (!movable.length) {
            const destination = categoryScopeName(references.labelFor(folder)?.title ?? folder, inboxCategory);
            const denied = checked.some(({ check }) => {
                return check.deniedElements.length > 0;
            });
            throw new ToolInputError(nothingMovedMessage(destination, denied));
        }

        // Read before the move: afterwards the first email already carries the destination tab.
        const sourceCategoryID = elementCategoryID(elements[0]) ?? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT;
        for (const { group } of movable) {
            await mail.applyLocation({ type: APPLY_LOCATION_TYPES.MOVE, elements: group, destinationLabelID });
        }
        if (categoryLabelID) {
            const movedCount = movable.reduce((count, { group }) => {
                return count + group.length;
            }, 0);
            mail.reportRecategorize(sourceCategoryID, categoryLabelID, movedCount);
        }
    };

/**
 * The confirm card + result tile for move_emails: the shared selection body lets the user deselect
 * emails before applying, and the sentence counts what is still selected.
 */
export const moveEmailsCardRenderer: CardRenderer = {
    icon: IcFolderArrowIn,
    sentence: (action, labels) =>
        emailSelectionSentence(action, (emails) => {
            const target = locationScopeName(action.folder, action.category, labels);
            if (!target) {
                // translator: a move whose destination the model left out, e.g. "Move 3 emails"
                return c('Info').jt`Move ${emails}`;
            }
            const destination = sentenceValue(target);

            // translator: the emails being filed and where they are going, e.g. "Move 3 emails to Travel"
            return c('Info').jt`Move ${emails} to ${destination}`;
        }),
    renderBody: renderEmailSelectionBody,
    canApply: hasEmailSelection,
    detail: (action, labels) => {
        const count = emailIds(action).length;
        const dest = locationScopeName(action.folder, action.category, labels);
        return c('Info').ngettext(msgid`${count} email → ${dest}`, `${count} emails → ${dest}`, count);
    },
};

export const moveEmailsModule: MailToolModule = {
    definition: moveEmailsDefinition,
    createHandler: createMoveEmailsHandler,
    cardRenderer: moveEmailsCardRenderer,
};
