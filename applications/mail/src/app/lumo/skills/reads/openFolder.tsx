import { c } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import { PRIMARY_ONLY_NOTE, categoryScopeName, coversPrimaryOnly, resolveInboxTab } from '../../helpers/categories';
import { DEFAULT_FOLDER_LIST, DefaultFolderReference } from '../../helpers/defaultFolders';
import { filterHashFor, navigateAndReadRows, resolveMailboxLocation, sortHashFor } from '../../helpers/navigation';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { resolveMailboxFilter, resolveMailboxSort } from './mailboxView';
import type { AgentEmailRow } from './rows';
import { BULK_ACTION_NOTE, formatAgentEmailRows } from './rows';

export interface OpenFolderParams {
    /** A default folder's fixed reference, or a folder-… / label-… reference from list_folders / list_labels. */
    target: string;
    /**
     * One Inbox category tab, valid only with `folder-inbox`. Null opens the location as a whole, except the
     * Inbox with tabs on, where Mail lands on Primary.
     */
    category: string | null;
    /** Single-value view filter — "read" | "unread" | "has_attachment", or null for no filter. */
    filter: string | null;
    /** View sort — "newest" | "oldest" | "largest" | "smallest", or null for the default order. */
    sort: string | null;
}

export interface OpenFolderResult {
    /** Human name of the opened location (e.g. "Spam", or the custom folder/label's name); never a reference. */
    location: string;
    /** The emails now on screen in that location. */
    rows: AgentEmailRow[];
    /** Total in the opened view (may exceed `rows.length`). */
    total: number;
    /** Whether a bulk action is still emptying this location — why it can open with nothing in it. */
    bulkActionRunning: boolean;
    /** Whether this opened the Inbox with tabs on and no tab named, so it shows Primary only. */
    primaryOnly: boolean;
}

export const openFolderDefinition: ToolDefinition<OpenFolderParams, OpenFolderResult> = {
    name: 'open_folder',
    kind: 'read',
    toolDescription: `Open a mailbox location and return the emails now on screen there (metadata only, no bodies), like a fresh view of that location. Use this INSTEAD of search when the user names a location they can see in the left panel. Set \`target\` to the location's reference: one of the default folders ${DEFAULT_FOLDER_LIST}, which are always valid with no earlier read; or, for one of the user's own folders or labels, its folder-… / label-… reference from list_folders / list_labels. To open ONE Inbox category tab ("show my Promotions"), set \`target\` to "folder-inbox" AND \`category\` to one of the tabs the mail context lists under "Category tabs"; leave \`category\` null for every other location, and when the mail context says category tabs are off. Optionally narrow the view with \`filter\` (exactly one of "read" | "unread" | "has_attachment": single-value, they cannot combine) and order it with \`sort\` ("newest" | "oldest" by date, or "largest" | "smallest" by size); leave either null to skip it. For a keyword, sender, recipient or date query, use search instead. Example: unread mail in Archive, newest first → { "target": "folder-archive", "category": null, "filter": "unread", "sort": "newest" }.`,
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['target', 'category', 'filter', 'sort'],
        properties: {
            target: { type: 'string' },
            category: { type: ['string', 'null'] },
            filter: { type: ['string', 'null'] },
            sort: { type: ['string', 'null'] },
        },
    },
    examples: [
        {
            context:
                'The user asks to see their Sent mail. Sent is a default folder, so open it by its fixed reference rather than searching.',
            call: { target: DefaultFolderReference.SENT, category: null, filter: null, sort: null },
        },
        {
            context: 'list_folders returned `folder-x7b2q1 | "Travel"` and the user asks to open their Travel folder.',
            call: { target: 'folder-x7b2q1', category: null, filter: null, sort: null },
        },
        {
            context: 'The user asks to show only their unread mail in Archive, newest first.',
            call: { target: DefaultFolderReference.ARCHIVE, category: null, filter: 'unread', sort: 'newest' },
        },
        {
            context:
                'The mail context reads "Category tabs: primary, social, promotions" and the user asks to show their Promotions.',
            call: { target: DefaultFolderReference.INBOX, category: 'promotions', filter: null, sort: null },
        },
    ],
    serializeForLumo: (result) => {
        const empty = result.bulkActionRunning ? BULK_ACTION_NOTE : `No emails in ${result.location}.`;
        const rows = formatAgentEmailRows(result.rows, result.total) || empty;
        const note = result.primaryOnly ? `\n${PRIMARY_ONLY_NOTE}` : '';
        return `Opened ${result.location}:\n${rows}${note}`;
    },
    summarizeChip: (_params, result) => {
        const location = result.location;
        return { label: c('Info').t`Opened ${location}` };
    },
};

/**
 * open_folder behaves as a read (auto-run, no confirmation): it navigates the mailbox to a named
 * location (a default folder, or the user's own folder or label), updating the user's screen. It returns
 * the emails now on screen, so the model sees them without a follow-up view_emails.
 */
export const createOpenFolderHandler =
    (mail: MailToolDeps): ToolHandler<OpenFolderParams, OpenFolderResult> =>
    async ({ target, category, filter, sort }, { references }) => {
        const filterHash = filterHashFor(resolveMailboxFilter(filter));
        const sortHash = sortHashFor(resolveMailboxSort(sort));
        const categoryTabs = mail.getActiveCategoryTabs();
        const tab = resolveInboxTab({ target, category }, categoryTabs);

        const { labelID, name, pathname } = resolveMailboxLocation(target, references, mail.getMailSettings());

        // A plain open, optionally filtered/sorted/on a tab: naming only these keys clears any existing search.
        const { rows, total, bulkActionRunning } = await navigateAndReadRows(mail, references, {
            pathname,
            labelID,
            query: { filter: filterHash, sort: sortHash, category: tab },
        });

        return {
            location: categoryScopeName(name, tab),
            rows,
            total,
            bulkActionRunning,
            primaryOnly: coversPrimaryOnly({ target, category }, categoryTabs.length > 0),
        };
    };

export const openFolderModule: MailToolModule = {
    definition: openFolderDefinition,
    createHandler: createOpenFolderHandler,
};
