import type { Sort } from '@proton/shared/lib/mail/search';

import { sortToString } from '../../../helpers/mailboxUrl';

/**
 * What to do with the elements state when the location (URL) or the encrypted search status changes:
 * - `goToFirstPage`: switching between encrypted and backend search while not on the first page. The page must be
 *   reset BEFORE the elements state, otherwise a load is triggered on the previous page. The caller navigates to
 *   page 0 and stops, the resulting location change runs the transition again.
 * - `reset`: the cached elements cannot be reused, the state is rebuilt (and the list reloaded).
 * - `setParams`: the cached elements are still valid, only the params are updated.
 */
export type ParamsTransition = 'goToFirstPage' | 'reset' | 'setParams';

export interface ParamsTransitionInput {
    /** Params currently in the store */
    previous: {
        sort: Sort;
        searchKeyword: string | undefined;
        newsletterSubscriptionID: string | undefined;
    };
    /** Params read from the new location */
    next: {
        labelID: string | undefined;
        sort: Sort;
        searchKeyword: string | undefined;
        isSearching: boolean;
    };
    encryptedSearch: {
        esEnabled: boolean;
        previousEsEnabled: boolean;
        dbExists: boolean;
        previousDbExists: boolean;
    };
    /** Current page is the cached one, or next to a cached one */
    pageIsConsecutive: boolean;
    page: number;
}

const isInNewsletterView = ({ previous, next }: ParamsTransitionInput) =>
    previous.newsletterSubscriptionID !== undefined && next.labelID !== undefined;

const hasSearchKeywordChanged = ({ previous, next }: ParamsTransitionInput) =>
    next.searchKeyword !== previous.searchKeyword;

/**
 * Both flags decide whether a search goes to the index or to the server (see `isES`), and they
 * are read from IDB by different writers at startup - `esEnabled` by the ES config read,
 * `dbExists` later by `initializeES`. Watching only the first means a search running in
 * between is answered by the server and never retried against the index.
 */
const hasEncryptedSearchChangedWhileSearching = ({ encryptedSearch, next }: ParamsTransitionInput) => {
    const esEnabledChanged = encryptedSearch.esEnabled !== encryptedSearch.previousEsEnabled;
    const dbExistsChanged = encryptedSearch.dbExists !== encryptedSearch.previousDbExists;

    return next.isSearching && (esEnabledChanged || dbExistsChanged);
};

const isPageJump = ({ pageIsConsecutive }: ParamsTransitionInput) => !pageIsConsecutive;

const hasSortChanged = ({ previous, next }: ParamsTransitionInput) =>
    sortToString(next.sort) !== sortToString(previous.sort);

/**
 * The rules are checked in order, the first one that matches wins.
 */
export const getParamsTransition = (input: ParamsTransitionInput): ParamsTransition => {
    // 1. Switching between encrypted and backend search away from the first page:
    // the page has to be reset before anything else, whatever the view.
    if (hasEncryptedSearchChangedWhileSearching(input) && input.page !== 0) {
        return 'goToFirstPage';
    }

    // 2. A new search keyword always resets, even in the newsletter view.
    if (hasSearchKeywordChanged(input)) {
        return 'reset';
    }

    // 3. In the newsletter view, the other changes keep the cached elements.
    if (isInNewsletterView(input)) {
        return 'setParams';
    }

    // 4. Elements cached for the previous params cannot be reused.
    if (hasEncryptedSearchChangedWhileSearching(input) || isPageJump(input) || hasSortChanged(input)) {
        return 'reset';
    }

    // 5. Nothing that invalidates the cache changed.
    return 'setParams';
};
