import { c } from 'ttag';

import type { CardRenderer } from '@proton/components/components/lumoAgent/types';
import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ActionRequest, ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import { CATEGORY_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN, MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { categoryDisplayName, resolveCategoryLabelID } from '../../helpers/categories';
import { locationDisplayName, resolveMailboxLocation } from '../../helpers/navigation';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { resolveOpenFolderTarget } from '../reads/openFolder';
import { referenceName } from './emailSelection';

/** Derived, so the model's vocabulary is exactly the one Mail's own URLs use, in the tabs' display order. */
export const INBOX_CATEGORIES = CATEGORY_LABEL_IDS.map((labelID) => LABEL_IDS_TO_HUMAN[labelID]);

export interface SetLocationReadParams {
    location: string | null;
    target: string | null;
    category: string | null;
    read: boolean;
}

/** Pure, like {@link resolveOpenFolderTarget}: whether the mailbox shows that tab needs the store, so the
 *  handler settles that half. */
export const resolveInboxCategory = ({
    location,
    category,
}: Pick<SetLocationReadParams, 'location' | 'category'>): string | undefined => {
    if (category == null) {
        return undefined;
    }
    if (location !== 'inbox') {
        throw new ToolInputError(
            '`category` is a tab inside the Inbox, so it only applies with `location: "inbox"`: leave `category` null for anywhere else.'
        );
    }
    if (!INBOX_CATEGORIES.includes(category)) {
        throw new ToolInputError(
            `Unknown category "${category}". Valid categories are: ${INBOX_CATEGORIES.join(
                ', '
            )}. Leave \`category\` null to cover the whole Inbox.`
        );
    }
    return category;
};

export const setLocationReadDefinition: ToolDefinition<SetLocationReadParams, void> = {
    name: 'set_location_read',
    kind: 'mutation',
    toolDescription:
        'Mark EVERY email in a whole location as read or unread — the entire folder or label, including mail that is not currently on screen. Use this when the user means a whole location ("mark my inbox as read", "mark everything in Newsletters unread"). For specific emails they can see, use set_read with their email-… references instead. Target the location exactly as open_folder does: set `location` to one of "inbox", "all_mail", "spam", "drafts", "starred", "trash", "archive"; OR set `target` to a custom folder-… / label-… reference from list_folders / list_labels. Pass EXACTLY ONE of those two and leave the other null. To cover ONE Inbox category tab rather than the whole Inbox, set `location` to "inbox" AND `category` to one of "primary", "social", "promotions", "newsletters", "transactions", "updates"; leave `category` null for the whole Inbox and for every other location — categories exist only in the Inbox, and only in mailboxes that show category tabs. Set `read` to true for "mark all as read", or false for "mark all as unread". Because this covers mail you have not seen, you cannot tell in advance whether anything needs changing — propose it whenever the user names a whole location. While the server works through the location, that location holds no readable list, so its emails cannot be read or changed one by one until it finishes: make this the LAST step of a chain rather than something you build on. Proposed to the user for confirmation before it runs.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['location', 'target', 'category', 'read'],
        properties: {
            location: { type: ['string', 'null'] },
            target: { type: ['string', 'null'] },
            category: { type: ['string', 'null'] },
            read: { type: 'boolean' },
        },
    },
    examples: [
        {
            context: 'The user asks to mark their whole inbox as read — every category tab in it, not just one.',
            call: { location: 'inbox', target: null, category: null, read: true },
        },
        {
            context: 'The user asks to mark everything in their Promotions tab as read.',
            call: { location: 'inbox', target: null, category: 'promotions', read: true },
        },
        {
            context:
                'list_labels returned `label-m3n4p5 | "Newsletters"` and the user asks to mark everything in Newsletters as read.',
            call: { location: null, target: 'label-m3n4p5', category: null, read: true },
        },
    ],
    // Surfaced via the confirm card, not the working set, so these stay trivial (see the shared contract).
    serializeForLumo: () => '',
    summarizeChip: ({ read }) => ({
        label: read ? c('Info').t`Mark all as read` : c('Info').t`Mark all as unread`,
    }),
};

/** Not routed through `useMarkAllAs`: it opens its own SelectAllMarkModal, and the confirm card already IS
 *  the confirmation. */
export const createSetLocationReadHandler =
    (mail: MailToolDeps): ToolHandler<SetLocationReadParams, void> =>
    async ({ location, target, category, read }, { references }) => {
        const resolved = resolveOpenFolderTarget({ location, target });
        const inboxCategory = resolveInboxCategory({ location, category });
        const { labelID } = resolveMailboxLocation(resolved, references, mail.getMailSettings());
        // Always explicit: left unset, the thunk falls back to the categories the LIST is showing, which
        // silently narrows "my whole inbox" to whichever tab the user happens to be sitting on.
        const categoryIDs = inboxCategory ? [resolveCategoryLabelID(inboxCategory, mail.getActiveCategoryTabs())] : [];

        await mail.markAll({
            SourceLabelID: labelID,
            status: read ? MARK_AS_STATUS.READ : MARK_AS_STATUS.UNREAD,
            categoryIDs,
        });
    };

const targetName = (action: ActionRequest, labels: Record<string, string>): string => {
    if (action.target) {
        return referenceName(action.target, labels);
    }
    if (action.location) {
        return locationDisplayName(String(action.location));
    }
    return '';
};

const scopeName = (action: ActionRequest, labels: Record<string, string>): string => {
    const location = targetName(action, labels);
    if (!location || !action.category) {
        return location;
    }
    const category = categoryDisplayName(String(action.category));

    return `${location} · ${category}`;
};

const scope = (action: ActionRequest, labels: Record<string, string>) => scopeName(action, labels) || undefined;

/** No body: a whole location has no rows to deselect. The card and the settled tile share one scope so they
 *  name the same blast radius. */
export const setLocationReadCardRenderer: CardRenderer = {
    icon: IcEnvelopes,
    title: (action) => (action.read ? c('Title').t`Mark all as read` : c('Title').t`Mark all as unread`),
    subtitle: scope,
    detail: scope,
};

export const setLocationReadModule: MailToolModule = {
    definition: setLocationReadDefinition,
    createHandler: createSetLocationReadHandler,
    cardRenderer: setLocationReadCardRenderer,
};
