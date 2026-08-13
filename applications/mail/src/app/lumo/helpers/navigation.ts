import type { ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { getStandardFolders } from 'proton-mail/helpers/labels';
import {
    contextTotal as contextTotalSelector,
    selectLoading,
    selectPage,
    selectParams,
} from 'proton-mail/store/elements/elementsSelectors';

import type { MailboxFilter, MailboxSort } from '../skills/reads/mailboxView';
import type { OpenFolderLocation } from '../skills/reads/openFolder';
import type { ToolStore } from '../toolModule';
import { resolveId } from './references';

/** Give up waiting on a stuck load so a read never hangs; results just won't be ready yet. */
const LIST_SETTLE_TIMEOUT = 20_000;

type FilterHash = 'read' | 'unread' | 'has-file';

type SortHash = 'date' | '-size' | 'size';

/** Mail-URL vocabulary for the view controls, kept here rather than in the pure tool definitions. Both
 *  maps are exhaustive, so adding a filter or a sort fails to compile until it is mapped. */
const FILTER_HASHES: Record<MailboxFilter, FilterHash> = {
    read: 'read',
    unread: 'unread',
    has_attachment: 'has-file',
};

/** `newest` is the mailbox default, so it maps to no hash key at all. */
const SORT_HASHES: Record<MailboxSort, SortHash | undefined> = {
    newest: undefined,
    oldest: 'date',
    largest: '-size',
    smallest: 'size',
};

/** Map a validated {@link MailboxFilter} onto the mailbox `filter` hash value; undefined clears it. */
export const filterHashFor = (filter: MailboxFilter | undefined): FilterHash | undefined => {
    if (filter === undefined) {
        return undefined;
    }

    return FILTER_HASHES[filter];
};

/** Map a validated {@link MailboxSort} onto the mailbox `sort` hash value; newest (the default) clears the key. */
export const sortHashFor = (sort: MailboxSort | undefined): SortHash | undefined => {
    if (sort === undefined) {
        return undefined;
    }

    return SORT_HASHES[sort];
};

/** The fixed standard-location table; `drafts` is overridden by the Show-moved setting at resolve time. */
const LOCATION_LABEL_IDS: Record<OpenFolderLocation, MAILBOX_LABEL_IDS> = {
    inbox: MAILBOX_LABEL_IDS.INBOX,
    all_mail: MAILBOX_LABEL_IDS.ALL_MAIL,
    spam: MAILBOX_LABEL_IDS.SPAM,
    drafts: MAILBOX_LABEL_IDS.DRAFTS,
    starred: MAILBOX_LABEL_IDS.STARRED,
    trash: MAILBOX_LABEL_IDS.TRASH,
    archive: MAILBOX_LABEL_IDS.ARCHIVE,
};

/**
 * Resolve an open_folder-style location/target to its mailbox label id (+ human name and nav path). A
 * standard location maps through the fixed table (Drafts follows the Show-moved setting, matching which
 * one the sidebar links to); a custom folder/label resolves its reference.
 */
export const resolveMailboxLocation = (
    resolved: { location: OpenFolderLocation } | { target: string },
    references: ReferenceRegistry,
    mailSettings: MailSettings
): { labelID: string; name: string; pathname: string } => {
    if ('location' in resolved) {
        const showsAllDrafts = hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS);
        const labelID =
            resolved.location === 'drafts' && showsAllDrafts
                ? MAILBOX_LABEL_IDS.ALL_DRAFTS
                : LOCATION_LABEL_IDS[resolved.location];
        const standard = getStandardFolders()[labelID];
        return { labelID, name: standard?.name || resolved.location, pathname: standard?.to || `/${labelID}` };
    }
    const labelID = resolveId(resolved.target, references);
    return { labelID, name: references.labelFor(resolved.target) || labelID, pathname: `/${labelID}` };
};

/**
 * Resolve once the mailbox list has settled on the expected location: the params match the plain
 * (search-free) view we navigated to, nothing is loading, and a total has been recorded — so a read
 * sees the folder's emails, not a mid-navigation page. Times out rather than hanging on a stuck load.
 *
 * Every input is Redux state, so the wait is driven by a store subscription rather than a poll.
 */
export const waitForListSettled = (store: ToolStore, expected: { labelID: string }): Promise<void> =>
    new Promise((resolve) => {
        const settled = () => {
            const state = store.getState();
            const { labelID, search } = selectParams(state);
            const paramsMatch = labelID === expected.labelID && !search.keyword && !search.from && !search.to;
            const isLoading = selectLoading(state, { page: selectPage(state) });
            return paramsMatch && !isLoading && contextTotalSelector(state) !== undefined;
        };

        if (settled()) {
            resolve();
            return;
        }

        let unsubscribe: () => void;
        let timeout: ReturnType<typeof setTimeout>;
        const finish = () => {
            unsubscribe();
            clearTimeout(timeout);
            resolve();
        };
        unsubscribe = store.subscribe(() => {
            if (settled()) {
                finish();
            }
        });
        timeout = setTimeout(finish, LIST_SETTLE_TIMEOUT);
    });
