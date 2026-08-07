/**
 * Shared fixtures for the navigation reads. The fake elements store derives its params from a URL exactly
 * as `useElements` does — so the settle predicate and the handlers are exercised against the real URL
 * vocabulary rather than a hand-built params object. Used by the `waitForListSettled` unit tests and the
 * `open_folder` / `search` / content-coverage tests.
 */
import { createLocation } from 'history';

import { defaultESStatus } from '@proton/encrypted-search/constants';
import type { ESStatusBooleans } from '@proton/encrypted-search/models';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getElementContextIdentifier } from 'proton-mail/helpers/elements';
import { categoryIDFromUrl, extractSearchParameters, filterFromUrl, sortFromUrl } from 'proton-mail/helpers/mailboxUrl';
import type { Element } from 'proton-mail/models/element';
import { newElementsState } from 'proton-mail/store/elements/elementsSlice';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';

import type { ToolStore } from '../toolModule';

export const locationFor = (labelID: string, hash = '') => createLocation(`/${labelID}${hash && `#${hash}`}`);

/**
 * A device with Encrypted Search present, on and fully indexed — the state every content-coverage case
 * degrades from. Built off the production default so a new `ESStatusBooleans` field can never be missed.
 */
export const indexedESStatus = (overrides: Partial<ESStatusBooleans> = {}): ESStatusBooleans => ({
    ...defaultESStatus,
    dbExists: true,
    esEnabled: true,
    contentIndexingDone: true,
    ...overrides,
});

interface SettledView {
    labelID: string;
    hash?: string;
    elements?: Element[];
    /** Off by default, matching a mailbox with no category tabs: `useElements` then leaves `categoryIDs` empty. */
    categoryViewEnabled?: boolean;
}

/** The state the app reaches once the list has loaded the view described by `labelID` + `hash`. Loaded
 *  from the server, so bodies were not searched — an Encrypted Search run overrides `usedEncryptedSearch`. */
export const settledView = ({
    labelID,
    hash = '',
    elements = [],
    categoryViewEnabled = false,
}: SettledView): Partial<ElementsState> => {
    const location = locationFor(labelID, hash);
    const search = extractSearchParameters(location);
    // Mirrors useElements: the category is read off the URL only on the Inbox, and only with the view on.
    const categoryIDs: CategoryLabelID[] =
        categoryViewEnabled && labelID === MAILBOX_LABEL_IDS.INBOX
            ? [categoryIDFromUrl(location) ?? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]
            : [];
    const params = {
        ...newElementsState().params,
        labelID,
        sort: sortFromUrl(location, labelID),
        filter: filterFromUrl(location),
        search,
        isSearching: !!search.keyword,
        categoryIDs,
    };
    const context = getElementContextIdentifier({
        labelID,
        categoryIDs,
        conversationMode: params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: search.from,
        to: search.to,
        address: search.address,
        begin: search.begin,
        end: search.end,
        keyword: search.keyword,
        newsletterSubscriptionID: undefined,
    });

    return {
        params,
        elements: Object.fromEntries(elements.map((element) => [element.ID, element])),
        beforeFirstLoad: false,
        pendingRequest: false,
        pendingESSearches: 0,
        usedEncryptedSearch: false,
        invalidated: false,
        total: { [context]: elements.length },
        pages: { [context]: [0] },
    };
};

/** Listeners run synchronously on change, as `dispatch` does. */
export const fakeStore = (overrides: Partial<ElementsState> = {}) => {
    let elements: ElementsState = { ...newElementsState(), ...overrides };
    const listeners = new Set<() => void>();

    const store = {
        getState: () => ({ elements, mailSettings: { value: undefined }, addresses: { value: [] } }) as any,
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    } as ToolStore;

    const change = (next: Partial<ElementsState>) => {
        elements = { ...elements, ...next };
        listeners.forEach((listener) => listener());
    };

    return { store, change, listenerCount: () => listeners.size };
};
