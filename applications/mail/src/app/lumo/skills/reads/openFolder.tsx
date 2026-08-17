import { c } from 'ttag';

import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import { filterHashFor, navigateAndReadRows, resolveMailboxLocation, sortHashFor } from '../../helpers/navigation';
import type { MailToolDeps, MailToolModule } from '../../toolModule';
import { resolveMailboxFilter, resolveMailboxSort } from './mailboxView';
import type { AgentEmailRow } from './rows';
import { BULK_ACTION_NOTE, formatAgentEmailRows } from './rows';

/** The seven standard left-panel locations open_folder understands. A custom folder/label is opened
 *  via `target` (its folder-… / label-… reference) instead. */
export const OPEN_FOLDER_LOCATIONS = ['inbox', 'all_mail', 'spam', 'drafts', 'starred', 'trash', 'archive'] as const;

export type OpenFolderLocation = (typeof OPEN_FOLDER_LOCATIONS)[number];

export interface OpenFolderParams {
    /** A standard location (see {@link OPEN_FOLDER_LOCATIONS}), or null when opening a custom target. */
    location: string | null;
    /** A folder-… / label-… reference from list_folders / list_labels, or null for a standard location. */
    target: string | null;
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
}

/**
 * Validate open_folder params: EXACTLY ONE of `location`/`target` must be set, and `location` (when
 * used) must be a known standard location. Pure, so the handler can enforce the rule before touching
 * the store — a violation throws a self-correcting Error the engine feeds back to the model. Returns
 * which target was chosen.
 */
export const resolveOpenFolderTarget = (
    params: Pick<OpenFolderParams, 'location' | 'target'>
): { location: OpenFolderLocation } | { target: string } => {
    const { location, target } = params;
    // (location == null) === (target == null) is true when BOTH are null or BOTH are set.
    if ((location == null) === (target == null)) {
        throw new ToolInputError(
            'open_folder needs EXACTLY ONE of `location` (a standard location) or `target` (a custom folder/label reference): set one and leave the other null.'
        );
    }
    if (location != null) {
        if (!(OPEN_FOLDER_LOCATIONS as readonly string[]).includes(location)) {
            throw new ToolInputError(
                `Unknown location "${location}". Valid locations are: ${OPEN_FOLDER_LOCATIONS.join(
                    ', '
                )}. For a custom folder or label, pass its reference as \`target\` instead.`
            );
        }
        return { location: location as OpenFolderLocation };
    }
    return { target: target as string };
};

export const openFolderDefinition: ToolDefinition<OpenFolderParams, OpenFolderResult> = {
    name: 'open_folder',
    kind: 'read',
    toolDescription:
        'Open a mailbox location and return the emails now on screen there (metadata only — no bodies), like a fresh view of that location. Use this INSTEAD of search when the user names a location they can see in the left panel: set `location` to one of "inbox", "all_mail", "spam", "drafts", "starred", "trash", "archive"; OR, for a custom folder or label, set `target` to its folder-… / label-… reference from list_folders / list_labels. Pass EXACTLY ONE of the two — set `location` and leave `target` null for a standard location, or set `target` and leave `location` null for a custom one. Optionally narrow the view with `filter` (exactly one of "read" | "unread" | "has_attachment" — single-value, they cannot combine) and order it with `sort` ("newest" | "oldest" by date, or "largest" | "smallest" by size); leave either null to skip it. For a keyword, sender, recipient or date query, use search instead. Example: unread mail in Archive, newest first → { "location": "archive", "target": null, "filter": "unread", "sort": "newest" }.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['location', 'target', 'filter', 'sort'],
        properties: {
            location: { type: ['string', 'null'] },
            target: { type: ['string', 'null'] },
            filter: { type: ['string', 'null'] },
            sort: { type: ['string', 'null'] },
        },
    },
    examples: [
        {
            context:
                'The user asks to see their Spam. Spam is a standard location, so open it directly rather than searching.',
            call: { location: 'spam', target: null, filter: null, sort: null },
        },
        {
            context: 'list_folders returned `folder-x7b2q1 | "Travel"` and the user asks to open their Travel folder.',
            call: { location: null, target: 'folder-x7b2q1', filter: null, sort: null },
        },
        {
            context: 'The user asks to show only their unread mail in Archive, newest first.',
            call: { location: 'archive', target: null, filter: 'unread', sort: 'newest' },
        },
    ],
    serializeForLumo: (result) => {
        const empty = result.bulkActionRunning ? BULK_ACTION_NOTE : `No emails in ${result.location}.`;
        const rows = formatAgentEmailRows(result.rows, result.total) || empty;
        return `Opened ${result.location}:\n${rows}`;
    },
    summarizeChip: (_params, result) => {
        const location = result.location;
        return { label: c('Info').t`Opened ${location}` };
    },
};

/**
 * open_folder behaves as a read (auto-run, no confirmation): it navigates the mailbox to a named
 * location (standard, or a custom folder/label) — updating the user's screen — and returns the emails
 * now on screen, so the model sees them without a follow-up view_emails.
 */
export const createOpenFolderHandler =
    (mail: MailToolDeps): ToolHandler<OpenFolderParams, OpenFolderResult> =>
    async ({ location, target, filter, sort }, { references }) => {
        // EXACTLY-ONE / known-location enforcement lives in the pure resolvers so they stay testable; a
        // violation throws a self-correcting error the engine feeds back to the model.
        const resolved = resolveOpenFolderTarget({ location, target });
        const filterHash = filterHashFor(resolveMailboxFilter(filter));
        const sortHash = sortHashFor(resolveMailboxSort(sort));

        const { labelID, name, pathname } = resolveMailboxLocation(resolved, references, mail.getMailSettings());

        // A plain open, optionally filtered/sorted: naming only these two keys clears any existing search.
        const { rows, total, bulkActionRunning } = await navigateAndReadRows(mail, references, {
            pathname,
            labelID,
            query: { filter: filterHash, sort: sortHash },
        });

        return { location: name, rows, total, bulkActionRunning };
    };

export const openFolderModule: MailToolModule = {
    definition: openFolderDefinition,
    createHandler: createOpenFolderHandler,
};
