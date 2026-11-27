import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import type { MailState } from '../../store';
import { addESResults } from '../elementsReducers';
import {
    contextTotal,
    elements as elementsSelector,
    hasOrderedSearchResults,
    placeholderCount,
    shouldInvalidateElementsState,
    shouldLoadElements,
} from '../elementsSelectors';
import { newElementsState } from '../elementsSlice';
import type { ElementsState, ElementsStateParams } from '../elementsTypes';

const message = (ID: string, Time: number, overrides: Partial<Message> = {}) =>
    ({
        ID,
        ConversationID: `conversation-${ID}`,
        Time,
        Unread: 1,
        LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
        Sender: { Name: 'John Doe', Address: 'john@example.com' },
        ToList: [],
        CCList: [],
        BCCList: [],
        ...overrides,
    }) as unknown as Message;

const toMailState = (state: ElementsState, pageSize = MAIL_PAGE_SIZE.FIFTY) =>
    ({
        elements: state,
        mailSettings: { value: { PageSize: pageSize } },
        addresses: { value: [] },
    }) as unknown as MailState;

describe('elements selector — ordered search results', () => {
    let state: Draft<ElementsState>;
    let params: ElementsStateParams;

    const deliver = (results: Message[], ordered: boolean, pageSize = MAIL_PAGE_SIZE.FIFTY) => {
        addESResults(state, {
            type: 'elements/addESResults',
            payload: { page: state.page, elements: results, params, pageSize, ordered },
        });
    };

    const visibleIDs = (pageSize = MAIL_PAGE_SIZE.FIFTY) =>
        elementsSelector(toMailState(state, pageSize)).map(({ ID }) => ID);

    beforeEach(() => {
        params = {
            ...newElementsState().params,
            conversationMode: false,
            // `jonh` is not a substring of the sender, as a fuzzy match would produce
            search: { keyword: 'invoice', from: 'jonh' },
        };
        state = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
    });

    it('keeps the order given by the search instead of sorting by time', () => {
        deliver([message('old', 1), message('new', 3), message('mid', 2)], true);

        expect(visibleIDs()).toEqual(['old', 'new', 'mid']);
    });

    it('does not re-check search criteria the search already evaluated', () => {
        deliver([message('a', 1)], true);

        expect(visibleIDs()).toEqual(['a']);
    });

    it('drops elements moved out of the location', () => {
        deliver([message('a', 2), message('b', 1)], true);
        state.elements.a = message('a', 2, { LabelIDs: [MAILBOX_LABEL_IDS.TRASH] });

        expect(visibleIDs()).toEqual(['b']);
    });

    it('drops elements no longer in state', () => {
        deliver([message('a', 2), message('b', 1)], true);
        delete state.elements.a;

        expect(visibleIDs()).toEqual(['b']);
    });

    it('drops elements that no longer match the unread filter unless they bypass it', () => {
        params = { ...params, filter: { Unread: 1 } };
        state.params = params;
        deliver([message('a', 3), message('b', 2), message('c', 1)], true);
        state.elements.a = message('a', 3, { Unread: 0 });
        state.elements.b = message('b', 2, { Unread: 0 });
        state.bypassFilter = ['b'];

        expect(visibleIDs()).toEqual(['b', 'c']);
    });

    it('slices pages out of the ordered list', () => {
        const results = Array.from({ length: 60 }, (_, i) => message(`m${i}`, i));
        deliver(results, true);
        state.page = 1;

        expect(visibleIDs()).toEqual(results.slice(50).map(({ ID }) => ID));
    });

    it('still filters and sorts results that are not ordered', () => {
        params = { ...params, search: { keyword: 'invoice', from: 'john' } };
        state.params = params;
        deliver(
            [message('old', 1), message('new', 3), message('other', 2, { Sender: { Name: '', Address: 'x@y.z' } })],
            false
        );

        expect(visibleIDs()).toEqual(['new', 'old']);
    });
});

describe('elements totals — ordered search results', () => {
    let state: Draft<ElementsState>;
    const params: ElementsStateParams = {
        ...newElementsState().params,
        conversationMode: false,
        search: { keyword: 'invoice' },
    };

    const deliver = (results: Message[]) => {
        addESResults(state, {
            type: 'elements/addESResults',
            payload: { page: 0, elements: results, params, pageSize: MAIL_PAGE_SIZE.FIFTY, ordered: true },
        });
    };

    beforeEach(() => {
        state = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
    });

    it('flags the context as listing an ordered search result', () => {
        // Asserted on a separate state: the selectors are memoized and the state here is mutated in place
        const empty = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
        expect(hasOrderedSearchResults(toMailState(empty))).toBe(false);

        deliver([message('a', 1)]);

        expect(hasOrderedSearchResults(toMailState(state))).toBe(true);
    });

    it('counts the results still listed', () => {
        deliver([message('a', 2), message('b', 1)]);
        state.elements.a = message('a', 2, { LabelIDs: [MAILBOX_LABEL_IDS.TRASH] });

        expect(contextTotal(toMailState(state))).toBe(1);
    });

    // Otherwise a short page reads as missing results and re-runs the search, over and over
    it('does not ask for more elements once results left the list', () => {
        deliver(Array.from({ length: 60 }, (_, i) => message(`m${i}`, i)));
        state.elements.m0 = message('m0', 0, { LabelIDs: [MAILBOX_LABEL_IDS.TRASH] });
        state.page = 1;

        expect(shouldLoadElements(toMailState(state), { page: 1 })).toBe(false);
    });

    // Searching again there, while the page moves back, made the page flip back and forth and crash the app
    it('does not ask for more elements when the list shrinks below the current page', () => {
        deliver(Array.from({ length: 52 }, (_, i) => message(`m${i}`, i)));
        state.page = 1;
        state.elements.m1 = message('m1', 1, { LabelIDs: [MAILBOX_LABEL_IDS.TRASH] });
        state.elements.m2 = message('m2', 2, { LabelIDs: [MAILBOX_LABEL_IDS.TRASH] });

        expect(contextTotal(toMailState(state))).toBe(50);
        expect(shouldLoadElements(toMailState(state), { page: 1 })).toBe(false);
    });
});

describe('event handling — ordered search results', () => {
    let state: Draft<ElementsState>;
    const params: ElementsStateParams = {
        ...newElementsState().params,
        conversationMode: false,
        search: { keyword: 'invoice' },
    };

    const deliver = (results: Message[], ordered: boolean) => {
        addESResults(state, {
            type: 'elements/addESResults',
            payload: { page: 0, elements: results, params, pageSize: MAIL_PAGE_SIZE.FIFTY, ordered },
        });
    };

    beforeEach(() => {
        state = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
    });

    it('applies events to an ordered search result instead of invalidating it', () => {
        deliver([message('a', 1)], true);

        expect(shouldInvalidateElementsState(toMailState(state))).toBe(false);
    });

    it('still invalidates a keyword search whose results are not ordered', () => {
        deliver([message('a', 1)], false);

        expect(shouldInvalidateElementsState(toMailState(state))).toBe(true);
    });

    it('keeps the element in state over the copy in a later search snapshot', () => {
        deliver([message('a', 1)], true);
        state.elements.a = message('a', 1, { Unread: 0 });
        deliver([message('a', 1), message('b', 2)], true);

        expect((state.elements.a as Message).Unread).toBe(0);
        expect(state.elements.b).toBeDefined();
    });
});

describe('bypass filter — ordered search results', () => {
    it('keeps elements marked as read listed when the search hands its results over again', () => {
        const params: ElementsStateParams = {
            ...newElementsState().params,
            conversationMode: false,
            filter: { Unread: 1 },
            search: { keyword: 'invoice' },
        };
        const state = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
        const deliver = (results: Message[]) =>
            addESResults(state, {
                type: 'elements/addESResults',
                payload: { page: 0, elements: results, params, pageSize: MAIL_PAGE_SIZE.FIFTY, ordered: true },
            });

        deliver([message('a', 2), message('b', 1)]);
        state.elements.a = message('a', 2, { Unread: 0 });
        state.bypassFilter = ['a'];
        deliver([message('a', 2), message('b', 1)]);

        expect(elementsSelector(toMailState(state)).map(({ ID }) => ID)).toEqual(['a', 'b']);
    });

    it('does not count elements bypassing the filter twice in the placeholders', () => {
        const params: ElementsStateParams = {
            ...newElementsState().params,
            conversationMode: false,
            filter: { Unread: 1 },
            search: { keyword: 'invoice' },
        };
        const state = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
        addESResults(state, {
            type: 'elements/addESResults',
            payload: {
                page: 0,
                elements: [message('a', 2), message('b', 1)],
                params,
                pageSize: MAIL_PAGE_SIZE.FIFTY,
                ordered: true,
            },
        });
        state.elements.a = message('a', 2, { Unread: 0 });
        state.bypassFilter = ['a'];

        const mailState = {
            ...toMailState(state),
            newsletterSubscriptions: { value: undefined },
        } as unknown as MailState;
        expect(contextTotal(mailState)).toBe(2);
        expect(placeholderCount(mailState, { counts: { counts: [], loading: false } })).toBe(2);
    });

    it('still resets the bypass filter for unordered results', () => {
        const params: ElementsStateParams = {
            ...newElementsState().params,
            conversationMode: false,
            filter: { Unread: 1 },
            search: { keyword: 'invoice' },
        };
        const state = newElementsState({ params, beforeFirstLoad: false }) as Draft<ElementsState>;
        state.bypassFilter = ['a'];

        addESResults(state, {
            type: 'elements/addESResults',
            payload: { page: 0, elements: [message('b', 1)], params, pageSize: MAIL_PAGE_SIZE.FIFTY, ordered: false },
        });

        expect(state.bypassFilter).toEqual([]);
    });
});
