/**
 * A fake elements store for the navigation reads, deriving its params from a URL exactly as `useElements`
 * does — so the settle predicate and the handlers are exercised against the real URL vocabulary rather
 * than a hand-built params object. Shared by the `waitForListSettled` unit tests and the `open_folder` /
 * `search` handler tests.
 */
import { createLocation } from 'history';

import { getElementContextIdentifier } from 'proton-mail/helpers/elements';
import { extractSearchParameters, filterFromUrl, sortFromUrl } from 'proton-mail/helpers/mailboxUrl';
import type { Element } from 'proton-mail/models/element';
import { newElementsState } from 'proton-mail/store/elements/elementsSlice';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';

import type { ToolStore } from '../toolModule';

export const locationFor = (labelID: string, hash = '') => createLocation(`/${labelID}${hash && `#${hash}`}`);

/** The state the app reaches once the list has loaded the view described by `labelID` + `hash`. */
export const settledView = (labelID: string, hash = '', elements: Element[] = []): Partial<ElementsState> => {
    const location = locationFor(labelID, hash);
    const search = extractSearchParameters(location);
    const params = {
        ...newElementsState().params,
        labelID,
        sort: sortFromUrl(location, labelID),
        filter: filterFromUrl(location),
        search,
        isSearching: !!search.keyword,
    };
    const context = getElementContextIdentifier({
        labelID,
        categoryIDs: params.categoryIDs,
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
