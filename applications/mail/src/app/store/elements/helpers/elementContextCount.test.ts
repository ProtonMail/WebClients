import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    generateElementContextIdentifier,
    setupMessage,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

import { computeFilteredCounts, updateContextTotal } from './elementContextCount';

const messageOne = 'msg-1';
const messageTwo = 'msg-2';
const messageThree = 'msg-3';

const makeState = (overrides: Record<string, any> = {}): Draft<ElementsState> =>
    ({
        elements: {},
        total: {},
        bypassFilter: [],
        params: {
            labelID: MAILBOX_LABEL_IDS.INBOX,
            categoryIDs: [],
            conversationMode: false,
            filter: {},
            sort: { sort: 'Time', desc: true },
            search: {},
            esEnabled: false,
            isSearching: false,
        },
        ...overrides,
    }) as unknown as Draft<ElementsState>;

describe('computeFilteredCounts', () => {
    it('returns an empty object when no contexts are cached', () => {
        const state = makeState({ elements: {}, total: {} });
        expect(computeFilteredCounts(state)).toEqual({});
    });

    it('returns 0 for all contexts when no elements are in state', () => {
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });

        const state = makeState({
            elements: {},
            total: { [inboxContext]: 10, [archiveContext]: 5 },
        });

        expect(computeFilteredCounts(state)).toEqual({
            [inboxContext]: 0,
            [archiveContext]: 0,
        });
    });

    it('counts elements correctly per label context', () => {
        const inboxMsg1 = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxMsg2 = setupMessage({
            messageID: messageTwo,
            unreadState: 'unread',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const archiveMsg = setupMessage({
            messageID: messageThree,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
        });

        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });

        const state = makeState({
            elements: {
                [messageOne]: inboxMsg1,
                [messageTwo]: inboxMsg2,
                [messageThree]: archiveMsg,
            },
            total: { [inboxContext]: 10, [archiveContext]: 5 },
        });

        expect(computeFilteredCounts(state)).toEqual({
            [inboxContext]: 2,
            [archiveContext]: 1,
        });
    });

    it('applies unread filter when computing counts', () => {
        const readMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const unreadMsg = setupMessage({
            messageID: messageTwo,
            unreadState: 'unread',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });

        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        const inboxUnreadContext = generateElementContextIdentifier({
            labelID: MAILBOX_LABEL_IDS.INBOX,
            filter: { Unread: 1 },
        });
        const inboxReadContext = generateElementContextIdentifier({
            labelID: MAILBOX_LABEL_IDS.INBOX,
            filter: { Unread: 0 },
        });

        const state = makeState({
            elements: { [messageOne]: readMsg, [messageTwo]: unreadMsg },
            total: { [inboxContext]: 5, [inboxUnreadContext]: 3, [inboxReadContext]: 2 },
        });

        expect(computeFilteredCounts(state)).toEqual({
            [inboxContext]: 2,
            [inboxUnreadContext]: 1,
            [inboxReadContext]: 1,
        });
    });

    it('applies bypassFilter only for the current context', () => {
        // readMsg does not match unread filter, but it is in bypassFilter
        const readMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const unreadMsg = setupMessage({
            messageID: messageTwo,
            unreadState: 'unread',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });

        // The current state params use the unread filter
        const currentUnreadContext = generateElementContextIdentifier({
            labelID: MAILBOX_LABEL_IDS.INBOX,
            filter: { Unread: 1 },
        });
        // This is a different context for the same label without filter
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });

        const state = makeState({
            elements: { [messageOne]: readMsg, [messageTwo]: unreadMsg },
            bypassFilter: [messageOne],
            total: { [currentUnreadContext]: 5, [inboxContext]: 5 },
            params: {
                labelID: MAILBOX_LABEL_IDS.INBOX,
                categoryIDs: [],
                conversationMode: false,
                filter: { Unread: 1 },
                sort: { sort: 'Time', desc: true },
                search: {},
            },
        });

        const counts = computeFilteredCounts(state);

        // bypassFilter applies to currentUnreadContext: readMsg bypasses the unread filter
        expect(counts[currentUnreadContext]).toBe(2);
        // bypassFilter does NOT apply to the no-filter inbox context
        expect(counts[inboxContext]).toBe(2);
    });
});

describe('updateContextTotal', () => {
    it('does not change totals when counts remain the same', () => {
        const inboxMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });

        const state = makeState({
            elements: { [messageOne]: inboxMsg },
            total: { [inboxContext]: 10 },
        });

        // Counts before and after are both 1 → total stays at 10
        const countsBeforeAction = { [inboxContext]: 1 };
        updateContextTotal({ state, countsBeforeAction });

        expect(state.total[inboxContext]).toBe(10);
    });

    it('decreases total when an element is removed from a context', () => {
        // After mutation, inbox has no messages
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });

        const state = makeState({
            elements: {},
            total: { [inboxContext]: 10 },
        });

        // Before mutation there was 1 element in inbox, now there are 0
        const countsBeforeAction = { [inboxContext]: 1 };
        updateContextTotal({ state, countsBeforeAction });

        expect(state.total[inboxContext]).toBe(9);
    });

    it('increases total when an element is added to a context', () => {
        const newMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });

        const state = makeState({
            elements: { [messageOne]: newMsg },
            total: { [inboxContext]: 10 },
        });

        // Before mutation there were 0 elements matching inbox, now there is 1
        const countsBeforeAction = { [inboxContext]: 0 };
        updateContextTotal({ state, countsBeforeAction });

        expect(state.total[inboxContext]).toBe(11);
    });

    it('updates multiple contexts independently', () => {
        // Simulate a move: msg-1 moved from inbox to archive
        const movedMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'unread',
            labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
        });
        const otherInboxMsg = setupMessage({
            messageID: messageTwo,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });

        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });

        const state = makeState({
            elements: { [messageOne]: movedMsg, [messageTwo]: otherInboxMsg },
            total: { [inboxContext]: 10, [archiveContext]: 5 },
        });

        // Before: 2 in inbox, 0 in archive. After: 1 in inbox, 1 in archive.
        const countsBeforeAction = { [inboxContext]: 2, [archiveContext]: 0 };
        updateContextTotal({ state, countsBeforeAction });

        expect(state.total[inboxContext]).toBe(9); // 10 - (2 - 1)
        expect(state.total[archiveContext]).toBe(6); // 5 - (0 - 1)
    });

    it('handles missing countBefore by treating it as 0', () => {
        const newMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });

        const state = makeState({
            elements: { [messageOne]: newMsg },
            total: { [inboxContext]: 10 },
        });

        // countsBeforeAction has no entry for inboxContext (treated as 0)
        const countsBeforeAction: Record<string, number> = {};
        updateContextTotal({ state, countsBeforeAction });

        // countBefore=0, countAfter=1 → total = 10 - (0 - 1) = 11
        expect(state.total[inboxContext]).toBe(11);
    });

    it('updates total correctly with unread filter contexts', () => {
        // Simulate marking an unread message as read
        const nowReadMsg: MessageMetadata = {
            ...setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            }),
            Unread: 0,
        };
        const otherUnreadMsg = setupMessage({
            messageID: messageTwo,
            unreadState: 'unread',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });

        const inboxUnreadContext = generateElementContextIdentifier({
            labelID: MAILBOX_LABEL_IDS.INBOX,
            filter: { Unread: 1 },
        });

        const state = makeState({
            elements: { [messageOne]: nowReadMsg, [messageTwo]: otherUnreadMsg },
            total: { [inboxUnreadContext]: 5 },
        });

        // Before: 2 unread messages. After read: only 1 unread message.
        const countsBeforeAction = { [inboxUnreadContext]: 2 };
        updateContextTotal({ state, countsBeforeAction });

        expect(state.total[inboxUnreadContext]).toBe(4); // 5 - (2 - 1)
    });
});
