import type { PayloadAction } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';

import { getElementContextIdentifier } from '../../helpers/elements';
import type { Element } from '../../models/element';
import { optimisticUpdates } from './elementsReducers';
import { newElementsState } from './elementsSlice';
import type { ElementsState, OptimisticUpdates } from './elementsTypes';

const createMockElement = (id: string, overrides: Partial<Element> = {}): Element => ({
    ID: id,
    LabelIDs: [],
    Time: Date.now(),
    Size: 1000,
    Unread: 0,
    ...overrides,
});

const createMockState = (overrides: Partial<ElementsState> = {}): ElementsState => ({
    ...newElementsState(),
    ...overrides,
});

const createOptimisticUpdatesAction = (payload: OptimisticUpdates): PayloadAction<OptimisticUpdates> => ({
    type: 'test',
    payload,
});

const setupMarkAsTest = (unreadFilter?: number) => {
    const filter: Filter = unreadFilter !== undefined ? { Unread: unreadFilter } : {};
    const sort: Sort = { sort: 'Time', desc: true };
    const search: SearchParameters = {};

    const params = {
        labelID: MAILBOX_LABEL_IDS.INBOX,
        conversationMode: false,
        filter,
        sort,
        search,
        esEnabled: false,
        isSearching: false,
    };
    const contextFilter = getElementContextIdentifier({
        labelID: params.labelID,
        conversationMode: params.conversationMode,
        filter: params.filter,
        sort: params.sort,
        from: params.search.from,
        to: params.search.to,
        address: params.search.address,
        begin: params.search.begin,
        end: params.search.end,
        keyword: params.search.keyword,
    });
    return createMockState({
        total: { [contextFilter]: 5 },
        params,
        bypassFilter: [],
    });
};

describe('optimisticUpdates reducer', () => {
    describe('basic element updates', () => {
        it('should update elements in state', () => {
            const element1 = createMockElement('element1');
            const element2 = createMockElement('element2');

            const state = createMockState({
                elements: {
                    element1: { ...element1, Size: 500 },
                },
            });

            const action = createOptimisticUpdatesAction({
                elements: [{ ...element1, Size: 1000 }, element2],
            });

            optimisticUpdates(state, action);

            expect(state.elements.element1.Size).toBe(1000);
            expect(state.elements.element2).toEqual(element2);
        });

        it('should skip elements without ID', () => {
            const elementWithoutId = { ...createMockElement('element1'), ID: '' };
            const element1 = createMockElement('element1');

            const state = createMockState();
            const action = createOptimisticUpdatesAction({
                elements: [elementWithoutId, element1],
            });

            optimisticUpdates(state, action);

            expect(Object.keys(state.elements)).toEqual(['element1']);
            expect(state.elements.element1).toEqual(element1);
        });
    });

    describe('move operations and total adjustments', () => {
        it('should update total when isMove is true and elementTotalAdjustment is provided', () => {
            const filter: Filter = {};
            const sort: Sort = { sort: 'Time', desc: true };
            const search: SearchParameters = {};

            const params = {
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: false,
                filter,
                sort,
                search,
                esEnabled: false,
                isSearching: false,
            };
            const contextFilter = getElementContextIdentifier({
                labelID: params.labelID,
                conversationMode: params.conversationMode,
                filter: params.filter,
                sort: params.sort,
                from: params.search.from,
                to: params.search.to,
                address: params.search.address,
                begin: params.search.begin,
                end: params.search.end,
                keyword: params.search.keyword,
            });
            const state = createMockState({
                total: { [contextFilter]: 10 },
                params,
            });

            const element1 = createMockElement('element1');
            const element2 = createMockElement('element2');

            const action = createOptimisticUpdatesAction({
                elements: [element1, element2],
                isMove: true,
                elementTotalAdjustment: -2,
            });

            optimisticUpdates(state, action);

            expect(state.total[contextFilter]).toBe(8);
        });

        it('should not update total when isMove is true but elementTotalAdjustment is not provided', () => {
            const filter: Filter = {};
            const sort: Sort = { sort: 'Time', desc: true };
            const search: SearchParameters = {};

            const params = {
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: false,
                filter,
                sort,
                search,
                esEnabled: false,
                isSearching: false,
            };
            const contextFilter = getElementContextIdentifier({
                labelID: params.labelID,
                conversationMode: params.conversationMode,
                filter: params.filter,
                sort: params.sort,
                from: params.search.from,
                to: params.search.to,
                address: params.search.address,
                begin: params.search.begin,
                end: params.search.end,
                keyword: params.search.keyword,
            });
            const state = createMockState({
                total: { [contextFilter]: 10 },
                params,
            });

            const element1 = createMockElement('element1');

            const action = createOptimisticUpdatesAction({
                elements: [element1],
                isMove: true,
            });

            optimisticUpdates(state, action);

            expect(state.total[contextFilter]).toBe(10);
        });

        it('should update bypassFilter when isMove is true', () => {
            const state = createMockState({
                bypassFilter: ['existing1', 'element1', 'existing2'],
            });

            const element1 = createMockElement('element1');
            const element2 = createMockElement('element2');

            const action = createOptimisticUpdatesAction({
                elements: [element1, element2],
                isMove: true,
            });

            optimisticUpdates(state, action);

            // Should remove element1 and element2 from bypassFilter
            expect(state.bypassFilter).toEqual(['existing1', 'existing2']);
        });
    });

    describe('mark as read/unread operations', () => {
        it('should add elements to bypassFilter and adjust total when marking as read with unread filter', () => {
            const state = setupMarkAsTest(1);
            const params = state.params;
            const contextFilter = getElementContextIdentifier({
                labelID: params.labelID,
                conversationMode: params.conversationMode,
                filter: params.filter,
                sort: params.sort,
                from: params.search.from,
                to: params.search.to,
                address: params.search.address,
                begin: params.search.begin,
                end: params.search.end,
                keyword: params.search.keyword,
            });

            const unreadElement = createMockElement('element1', { Unread: 1 });

            const action = createOptimisticUpdatesAction({
                elements: [unreadElement],
                bypass: true,
                conversationMode: false,
                markAsStatus: MARK_AS_STATUS.READ,
            });

            optimisticUpdates(state, action);

            expect(state.bypassFilter).toContain('element1');
            expect(state.total[contextFilter]).toBe(6); // +1 because marking as read
        });

        it('should not add elements to bypassFilter when marking as unread with unread filter', () => {
            const state = setupMarkAsTest(1);
            const params = state.params;
            const contextFilter = getElementContextIdentifier({
                labelID: params.labelID,
                conversationMode: params.conversationMode,
                filter: params.filter,
                sort: params.sort,
                from: params.search.from,
                to: params.search.to,
                address: params.search.address,
                begin: params.search.begin,
                end: params.search.end,
                keyword: params.search.keyword,
            });

            const readElement = createMockElement('element1', { Unread: 0 });

            const action = createOptimisticUpdatesAction({
                elements: [readElement],
                bypass: true,
                conversationMode: false,
                markAsStatus: MARK_AS_STATUS.UNREAD,
            });

            optimisticUpdates(state, action);

            // When marking as UNREAD with unread filter (1), elements should NOT be bypassed
            expect(state.bypassFilter).not.toContain('element1');
            expect(state.total[contextFilter]).toBe(5); // No change because no bypass
        });

        it('should not add elements to bypassFilter when bypass is false', () => {
            const state = setupMarkAsTest(1);

            const unreadElement = createMockElement('element1', { Unread: 1 });

            const action = createOptimisticUpdatesAction({
                elements: [unreadElement],
                bypass: false,
                conversationMode: false,
                markAsStatus: MARK_AS_STATUS.READ,
            });

            optimisticUpdates(state, action);

            expect(state.bypassFilter).not.toContain('element1');
        });

        it('should not duplicate elements in bypassFilter', () => {
            const state = setupMarkAsTest(1);
            state.bypassFilter = ['element1']; // Already exists

            const unreadElement = createMockElement('element1', { Unread: 1 });

            const action = createOptimisticUpdatesAction({
                elements: [unreadElement],
                bypass: true,
                conversationMode: false,
                markAsStatus: MARK_AS_STATUS.READ,
            });

            optimisticUpdates(state, action);

            expect(state.bypassFilter.filter((id) => id === 'element1')).toHaveLength(1);
        });

        it('should remove elements from bypassFilter when they dont need bypass', () => {
            const state = setupMarkAsTest(1);
            state.bypassFilter = ['element1', 'element2', 'other'];

            // When marking as UNREAD with unread filter (1), element should be removed from bypass
            const readElement = createMockElement('element1', { Unread: 0 });

            const action = createOptimisticUpdatesAction({
                elements: [readElement],
                bypass: true,
                conversationMode: false,
                markAsStatus: MARK_AS_STATUS.UNREAD,
            });

            optimisticUpdates(state, action);

            expect(state.bypassFilter).toEqual(['element2', 'other']);
        });
    });

    describe('conversation mode handling', () => {
        it('should use ConversationID for messages in conversation mode', () => {
            const state = setupMarkAsTest(1);

            const message = createMockElement('message1', {
                Unread: 1,
                ConversationID: 'conv1',
            });

            const action = createOptimisticUpdatesAction({
                elements: [message],
                bypass: true,
                conversationMode: true,
                markAsStatus: MARK_AS_STATUS.READ,
            });

            optimisticUpdates(state, action);

            expect(state.bypassFilter).toContain('conv1');
            expect(state.bypassFilter).not.toContain('message1');
        });

        it('should use element ID for conversations in conversation mode', () => {
            const state = setupMarkAsTest(1);

            const conversation = createMockElement('conv1', {
                Unread: 1,
                // Conversations don't have ConversationID
            });

            const action = createOptimisticUpdatesAction({
                elements: [conversation],
                bypass: true,
                conversationMode: true,
                markAsStatus: MARK_AS_STATUS.READ,
            });

            optimisticUpdates(state, action);

            expect(state.bypassFilter).toContain('conv1');
        });
    });

    describe('edge cases', () => {
        it('should handle missing total gracefully', () => {
            const filter: Filter = {};
            const sort: Sort = { sort: 'Time', desc: true };
            const search: SearchParameters = {};

            const params = {
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: false,
                filter,
                sort,
                search,
                esEnabled: false,
                isSearching: false,
            };
            const contextFilter = getElementContextIdentifier({
                labelID: params.labelID,
                conversationMode: params.conversationMode,
                filter: params.filter,
                sort: params.sort,
                from: params.search.from,
                to: params.search.to,
                address: params.search.address,
                begin: params.search.begin,
                end: params.search.end,
                keyword: params.search.keyword,
            });
            const state = createMockState({
                total: {},
                params,
            });

            const element1 = createMockElement('element1');

            const action = createOptimisticUpdatesAction({
                elements: [element1],
                isMove: true,
                elementTotalAdjustment: -1,
            });

            optimisticUpdates(state, action);

            expect(state.total[contextFilter]).toBe(-1);
        });

        it('should handle empty elements array', () => {
            const state = createMockState();
            const initialElementsCount = Object.keys(state.elements).length;

            const action = createOptimisticUpdatesAction({
                elements: [],
            });

            optimisticUpdates(state, action);

            expect(Object.keys(state.elements)).toHaveLength(initialElementsCount);
        });
    });
});
