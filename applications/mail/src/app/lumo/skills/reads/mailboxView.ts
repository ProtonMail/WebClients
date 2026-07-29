/**
 * Shared, store-free view controls for the navigation reads (`open_folder`, and `search` in a later
 * MR): a single-value `filter` (read / unread / has-attachment) and a `sort` (date or size). These map
 * onto the mailbox toolbar's Filter and Sort. Kept pure so a handler can validate a value before
 * touching the store — a bad token throws a self-correcting Error the engine feeds back to the model,
 * not a user-facing halt. Mapping these semantic tokens onto Mail's URL hash lives in the handler
 * (see `helpers/navigation`), not here.
 */

/** The three single-value view filters. Exactly ONE may apply: the `filter` hash key holds one value. */
export const MAILBOX_FILTERS = ['read', 'unread', 'has_attachment'] as const;

export type MailboxFilter = (typeof MAILBOX_FILTERS)[number];

/** The four view sorts: date (newest = descending / oldest = ascending) and size (largest / smallest). */
export const MAILBOX_SORTS = ['newest', 'oldest', 'largest', 'smallest'] as const;

export type MailboxSort = (typeof MAILBOX_SORTS)[number];

/**
 * Validate an optional `filter` param: `null`/absent yields `undefined` (no filter); otherwise it must
 * be one of {@link MAILBOX_FILTERS}. Throws a self-correcting Error listing the valid values on a bad
 * token.
 */
export const resolveMailboxFilter = (filter: string | null): MailboxFilter | undefined => {
    if (filter == null) {
        return undefined;
    }
    if (!(MAILBOX_FILTERS as readonly string[]).includes(filter)) {
        throw new Error(
            `Unknown filter "${filter}". Valid filters are: ${MAILBOX_FILTERS.join(
                ', '
            )} (single-value — pick exactly one).`
        );
    }
    return filter as MailboxFilter;
};

/**
 * Validate an optional `sort` param: `null`/absent yields `undefined` (default order); otherwise it
 * must be one of {@link MAILBOX_SORTS}. Throws a self-correcting Error listing the valid values on a
 * bad token.
 */
export const resolveMailboxSort = (sort: string | null): MailboxSort | undefined => {
    if (sort == null) {
        return undefined;
    }
    if (!(MAILBOX_SORTS as readonly string[]).includes(sort)) {
        throw new Error(`Unknown sort "${sort}". Valid sorts are: ${MAILBOX_SORTS.join(', ')}.`);
    }
    return sort as MailboxSort;
};
