import { c } from 'ttag';

import { IcEnvelopes } from '@proton/icons/icons/IcEnvelopes';
import type {
    ActionRequest,
    ReferenceLabels,
    ToolDefinition,
    ToolHandler,
} from '@proton/llm/lib/lumoAgent/contracts/types';
import type { CardRenderer } from '@proton/llm/lib/lumoAgent/ui/types';
import sentenceValue from '@proton/lumo-ui/shared-components/sentenceValue/sentenceValue';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { resolveCategoryLabelID, resolveInboxCategory } from '../../helpers/categories';
import { DEFAULT_FOLDER_LIST, DefaultFolderReference } from '../../helpers/defaultFolders';
import { resolveMailboxLocation } from '../../helpers/navigation';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { locationScopeName } from './emailSelection';

export interface SetLocationReadParams {
    target: string;
    category: string | null;
    read: boolean;
}

export const setLocationReadDefinition: ToolDefinition<SetLocationReadParams, void> = {
    name: 'set_location_read',
    kind: 'mutation',
    toolDescription: `Mark EVERY email in a whole location as read or unread: the entire folder or label, including mail that is not currently on screen. Use this when the user means a whole location ("mark my inbox as read", "mark everything in Newsletters unread"). For specific emails they can see, use set_read with their email-… references instead. Set \`target\` to the location exactly as open_folder does: one of the default folders ${DEFAULT_FOLDER_LIST}; or the user's own folder-… / label-… reference from list_folders / list_labels. To cover ONE Inbox category tab rather than the whole Inbox, set \`target\` to "folder-inbox" AND \`category\` to one of "primary", "social", "promotions", "newsletters", "transactions", "updates"; leave \`category\` null for the whole Inbox and for every other location. Categories exist only in the Inbox, and only in mailboxes that show category tabs. Set \`read\` to true for "mark all as read", or false for "mark all as unread". Because this covers mail you have not seen, you cannot tell in advance whether anything needs changing, so propose it whenever the user names a whole location. While the server works through the location, listing it returns nothing until it finishes: make this the LAST step of a chain rather than something you build on. Proposed to the user for confirmation before it runs.`,
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['target', 'category', 'read'],
        properties: {
            target: { type: 'string' },
            category: { type: ['string', 'null'] },
            read: { type: 'boolean' },
        },
    },
    examples: [
        {
            context: 'The user asks to mark their whole inbox as read — every category tab in it, not just one.',
            call: { target: DefaultFolderReference.INBOX, category: null, read: true },
        },
        {
            context: 'The user asks to mark everything in their Promotions tab as read.',
            call: { target: DefaultFolderReference.INBOX, category: 'promotions', read: true },
        },
        {
            context:
                'list_labels returned `label-m3n4p5 | "Newsletters"` and the user asks to mark everything in Newsletters as read.',
            call: { target: 'label-m3n4p5', category: null, read: true },
        },
    ],
    checkParams: (params) => {
        resolveInboxCategory(params);
    },
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
    async ({ target, category, read }, { references }) => {
        const inboxCategory = resolveInboxCategory({ target, category });
        const { labelID } = resolveMailboxLocation(target, references, mail.getMailSettings());
        // Always explicit: left unset, the thunk falls back to the categories the LIST is showing, which
        // silently narrows "my whole inbox" to whichever tab the user happens to be sitting on.
        const categoryIDs = inboxCategory ? [resolveCategoryLabelID(inboxCategory, mail.getActiveCategoryTabs())] : [];

        await mail.markAll({
            SourceLabelID: labelID,
            status: read ? MARK_AS_STATUS.READ : MARK_AS_STATUS.UNREAD,
            categoryIDs,
        });
    };

const scope = (action: ActionRequest, labels: ReferenceLabels) => {
    return locationScopeName(action.target, action.category, labels) || undefined;
};

/** No body: a whole location has no rows to deselect. The sentence and the settled tile's detail share one
 *  scope so they name the same blast radius. */
export const setLocationReadCardRenderer: CardRenderer = {
    icon: IcEnvelopes,
    sentence: (action, labels) => {
        const namedScope = locationScopeName(action.target, action.category, labels);
        if (!namedScope) {
            return c('Info').t`No location selected`;
        }
        const place = sentenceValue(namedScope);

        return action.read
            ? // translator: everything in a location, e.g. "Mark the whole of Inbox as read"
              c('Info').jt`Mark the whole of ${place} as read`
            : // translator: everything in a location, e.g. "Mark the whole of Inbox as unread"
              c('Info').jt`Mark the whole of ${place} as unread`;
    },
    // The same scope the sentence reads, so a card can never offer to apply what it cannot name. Labels
    // only supply a custom target's display name, which is beside the point of whether one was given.
    canApply: (params) => !!locationScopeName(params.target, params.category, {}),
    detail: scope,
};

export const setLocationReadModule: MailToolModule = {
    definition: setLocationReadDefinition,
    createHandler: createSetLocationReadHandler,
    cardRenderer: setLocationReadCardRenderer,
};
