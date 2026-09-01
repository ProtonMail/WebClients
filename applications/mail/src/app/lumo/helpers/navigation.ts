import type { Location } from 'history';
import { createLocation } from 'history';
import isDeepEqual from 'lodash/isEqual';

import type { ReferenceRegistry } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { ALMOST_ALL_MAIL, SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';
import type { SearchParameters } from '@proton/shared/lib/mail/search';

import { getStandardFolders } from '../../helpers/labels';
import {
    categoryIDFromUrl,
    extractSearchParameters,
    filterFromUrl,
    filterToString,
    sortFromUrl,
    sortToString,
} from '../../helpers/mailboxUrl';
import {
    contextTotal as contextTotalSelector,
    esSearching as esSearchingSelector,
    selectActiveCategoryID,
    selectLoading,
    selectPage,
    selectParams,
    taskRunningInLabel as taskRunningInLabelSelector,
    usedEncryptedSearch as usedEncryptedSearchSelector,
} from '../../store/elements/elementsSelectors';
import type { ElementsStateParams } from '../../store/elements/elementsTypes';

import type { MailboxFilter, MailboxSort } from '../skills/reads/mailboxView';
import type { OpenFolderLocation } from '../skills/reads/openFolder';
import type { AgentEmailPage } from '../skills/reads/rows';
import { buildAgentEmailRows } from '../skills/reads/rows';
import type { MailToolDeps, ToolStore } from '../toolModule';
import { resolveTypedId } from './references';
import { waitForStoreState } from './storeWait';

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

/** The fixed standard-location table; two entries are overridden by a mail setting at resolve time — see
 *  {@link labelIDForLocation}. */
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
 * Two standard locations are a PAIR of labels, and a mail setting picks which one the user actually has:
 * Drafts follows Show-moved, and All mail follows "Exclude Spam/Trash from All mail" (`ALMOST_ALL_MAIL`
 * drops Spam and Trash). Reading the setting is what keeps a read on the same label the sidebar links to —
 * take `ALL_MAIL` unconditionally and the agent searches mail the user's own search would never show them,
 * and lands them in a view their sidebar does not offer.
 */
const labelIDForLocation = (location: OpenFolderLocation, mailSettings: MailSettings): MAILBOX_LABEL_IDS => {
    if (location === 'drafts' && hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS)) {
        return MAILBOX_LABEL_IDS.ALL_DRAFTS;
    }
    if (location === 'all_mail' && mailSettings.AlmostAllMail === ALMOST_ALL_MAIL.ENABLED) {
        return MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL;
    }
    return LOCATION_LABEL_IDS[location];
};

/**
 * Resolve an open_folder-style location/target to its mailbox label id (+ human name and nav path). A
 * standard location maps through the fixed table, honouring the settings-dependent pairs
 * ({@link labelIDForLocation}); a custom folder/label resolves its reference.
 */
export const resolveMailboxLocation = (
    resolved: { location: OpenFolderLocation } | { target: string },
    references: ReferenceRegistry,
    mailSettings: MailSettings
): { labelID: string; name: string; pathname: string } => {
    if ('location' in resolved) {
        const labelID = labelIDForLocation(resolved.location, mailSettings);
        const standard = getStandardFolders()[labelID];
        return { labelID, name: standard?.name || resolved.location, pathname: standard?.to || `/${labelID}` };
    }
    const labelID = resolveTypedId(resolved.target, ['folder', 'label'], references);
    return { labelID, name: references.labelFor(resolved.target)?.title || labelID, pathname: `/${labelID}` };
};

/** Display name for copy that cannot reach the store. Takes a raw string because a confirm card renders a
 *  *proposed* location, before any handler has validated it; each settings-dependent pair shares one name. */
export const locationDisplayName = (location: string): string => {
    const labelID = LOCATION_LABEL_IDS[location as OpenFolderLocation];
    return (labelID && getStandardFolders()[labelID]?.name) || location;
};

/**
 * Every search-hash key a list navigation owns, cleared by default. Spread first so a caller only names
 * the keys it sets and cannot leave a previous navigation's `keyword`/`wildcard`/`page` behind — the two
 * navigation reads used to carry their own copy of this list, which is exactly how they would drift.
 */
const CLEARED_LIST_QUERY = {
    keyword: undefined,
    from: undefined,
    to: undefined,
    begin: undefined,
    end: undefined,
    filter: undefined,
    address: undefined,
    wildcard: undefined,
    sort: undefined,
    page: undefined,
    // Left behind, a read of "the Inbox" silently covers only the category tab the user happens to be on.
    category: undefined,
};

export type ListQuery = Partial<Record<keyof typeof CLEARED_LIST_QUERY, string | undefined>>;

export interface ExpectedList {
    labelID: string;
    /** The location just pushed. */
    location: Location;
}

/** Treat an empty query field as absent, so a cleared param and an unset one compare equal. */
const searchView = ({ address, from, to, keyword, begin, end, wildcard }: SearchParameters) => ({
    address: address || undefined,
    from: from || undefined,
    to: to || undefined,
    keyword: keyword || undefined,
    begin: begin || undefined,
    end: end || undefined,
    wildcard: wildcard || undefined,
});

/**
 * The view a navigation asked for, in the URL vocabulary `useElements` derives the params from — so
 * comparing the two is exactly "have the params caught up with the URL we pushed?", across the filter,
 * sort and date bounds as well as the label and keyword.
 */
const requestedView = ({ labelID, location }: ExpectedList) => ({
    labelID,
    filter: filterToString(filterFromUrl(location)),
    sort: sortToString(sortFromUrl(location, labelID)),
    search: searchView(extractSearchParameters(location)),
});

const currentView = ({ labelID, filter, sort, search }: ElementsStateParams) => ({
    labelID,
    filter: filterToString(filter),
    sort: sortToString(sort),
    search: searchView(search),
});

/** Both members end the wait; only `Settled` means the list arrived. `undefined` keeps waiting. */
enum ListSettleState {
    Settled = 'settled',
    Blocked = 'blocked',
}

/** What the wait can tell a read about the page it is about to project. */
export interface ListSettleOutcome {
    /** False when the wait timed out: the view is still loading, so an empty page proves nothing. */
    settled: boolean;
    /** Whether Encrypted Search produced the results, rather than the server's metadata-only search. Only
     *  ever true for a settled search: the store flag is global, so it says nothing about any other view. */
    usedEncryptedSearch: boolean;
}

/**
 * Resolve once the list has settled on the expected view, so a read sees what the user sees rather than
 * a mid-navigation or mid-batch page. Times out by resolving, so a stuck load degrades to "not ready" —
 * which the outcome reports, since a timed-out wait projects a page that is not yet the answer.
 * Every input is Redux state — that is what lets one subscription replace a poll.
 */
export const waitForListSettled = async (store: ToolStore, expected: ExpectedList): Promise<ListSettleOutcome> => {
    const requested = requestedView(expected);
    // Only a search can be mid-stream, and the counter is global: gating a plain open on it would hold the
    // read hostage to a search the user started elsewhere.
    const isQuery = Object.values(requested.search).some((value) => value !== undefined);
    const requestedCategory = categoryIDFromUrl(expected.location) ?? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT;

    const settled = (): ListSettleState | undefined => {
        const state = store.getState();
        if (!isDeepEqual(currentView(selectParams(state)), requested)) {
            return undefined;
        }
        // A category change keeps the same labelID and goes through `setParams`, so nothing above tells the
        // two tabs apart and no loading flag is raised: without this, clearing `category` resolves on the
        // tab the user was on. Absent means the category view is off, not that the default tab was asked for.
        const activeCategory = selectActiveCategoryID(state);
        if (activeCategory !== undefined && activeCategory !== requestedCategory) {
            return undefined;
        }
        // A bulk action (mark-all, label-all) blocks loading for its label until the server finishes, so
        // this view can never fill: stop rather than sitting out the timeout on a list that cannot arrive.
        // Checked only once the params match, so the empty page the caller then reads is this view's.
        if (taskRunningInLabelSelector(state, { labelID: expected.labelID })) {
            return ListSettleState.Blocked;
        }
        if (selectLoading(state, { page: selectPage(state) }) || (isQuery && esSearchingSelector(state))) {
            return undefined;
        }
        return contextTotalSelector(state) !== undefined ? ListSettleState.Settled : undefined;
    };

    const outcome = await waitForStoreState(store, settled, LIST_SETTLE_TIMEOUT);

    return {
        settled: outcome === ListSettleState.Settled,
        // The store flag is global and sticky — only a load for the current context clears it — so a plain
        // open, or a wait that timed out, would otherwise report a search the user ran somewhere else.
        usedEncryptedSearch:
            isQuery && outcome === ListSettleState.Settled && usedEncryptedSearchSelector(store.getState()),
    };
};

/** The slice of {@link MailToolDeps} a list navigation needs: the router to push, the store to read back. */
type NavigationDeps = Pick<MailToolDeps, 'store' | 'history' | 'getFolders' | 'getLabels' | 'getMailSettings'>;

/**
 * The whole shape of a navigation read (`open_folder`, `search`): push the requested view, wait for the
 * list to settle on it, then project what landed. Waiting is what stops the rows describing the *previous*
 * view, so the returned page always matches what the user now sees — and it means neither tool needs a
 * follow-up `view_emails`. It also covers Encrypted Search, which streams its results in batches: without
 * the settle, a search reads one partial batch and reports it as the whole result.
 */
export const navigateAndReadRows = async (
    deps: NavigationDeps,
    references: ReferenceRegistry,
    { pathname, labelID, query }: { pathname: string; labelID: string; query: ListQuery }
): Promise<AgentEmailPage & ListSettleOutcome> => {
    const url = changeSearchParams(pathname, deps.history.location.hash, { ...CLEARED_LIST_QUERY, ...query });
    deps.history.push(url);

    const outcome = await waitForListSettled(deps.store, { labelID, location: createLocation(url) });

    return { ...buildAgentEmailRows(deps, references), ...outcome };
};
