import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { eventUpdatesFulfilled, eventUpdatesPending } from 'proton-mail/store/elements/elementsReducers';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    CONVERSATION_ID,
    generateElementContextIdentifier,
    setupConversation,
    setupMessage,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

const messageOne = 'msg-1';
const messageTwo = 'msg-2';
const messageThree = 'msg-3';

const makeState = (overrides: Partial<Draft<ElementsState>> = {}): Draft<ElementsState> => {
    return {
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
        },
        taskRunning: { labelIDs: [], timeoutID: undefined },
        ...overrides,
    } as unknown as Draft<ElementsState>;
};

describe('eventUpdatesPending', () => {
    let state: Draft<ElementsState>;

    describe('toCreate', () => {
        beforeEach(() => {
            state = makeState();
        });

        it('increases total when a new element is added to a cached context', () => {
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state = makeState({ total: { [inboxContext]: 10 } });

            const newMessage = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [newMessage],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            });

            expect(state.elements[messageOne]).toBeDefined();
            expect(state.total[inboxContext]).toBe(11);
        });

        it('does not change totals when the created element is not in any cached context', () => {
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state = makeState({ total: { [inboxContext]: 10 } });

            const archiveMsg = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [archiveMsg],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            });

            expect(state.total[inboxContext]).toBe(10);
        });

        it('increases total for multiple cached contexts simultaneously', () => {
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            const allMailContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ALL_MAIL });
            state = makeState({ total: { [inboxContext]: 10, [allMailContext]: 20 } });

            const newMessage = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [newMessage],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            });

            expect(state.total[inboxContext]).toBe(11);
            expect(state.total[allMailContext]).toBe(21);
        });
    });

    describe('toDelete', () => {
        it('decreases total when an element in a cached context is deleted', () => {
            const inboxMsg = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state = makeState({
                elements: { [messageOne]: inboxMsg },
                total: { [inboxContext]: 10 },
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [messageOne],
                        conversationMode: false,
                    },
                },
            });

            expect(state.elements[messageOne]).toBeUndefined();
            expect(state.total[inboxContext]).toBe(9);
        });

        it('does not change totals when a deleted element was not in any cached context', () => {
            const archiveMsg = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
            });
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state = makeState({
                elements: { [messageOne]: archiveMsg },
                total: { [inboxContext]: 10 },
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [messageOne],
                        conversationMode: false,
                    },
                },
            });

            expect(state.total[inboxContext]).toBe(10);
        });

        it('decreases total correctly when multiple elements are deleted', () => {
            const msg1 = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });
            const msg2 = setupMessage({
                messageID: messageTwo,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state = makeState({
                elements: { [messageOne]: msg1, [messageTwo]: msg2 },
                total: { [inboxContext]: 10 },
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [messageOne, messageTwo],
                        conversationMode: false,
                    },
                },
            });

            expect(state.total[inboxContext]).toBe(8);
        });
    });

    describe('toUpdate', () => {
        it('decreases inbox total when a message label is changed via LabelIDsRemoved/LabelIDsAdded', () => {
            const inboxMsg = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL],
            });
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });
            state = makeState({
                elements: { [messageOne]: inboxMsg },
                total: { [inboxContext]: 10, [archiveContext]: 5 },
            });

            const updateEvent = {
                ID: messageOne,
                LabelIDsRemoved: [MAILBOX_LABEL_IDS.INBOX],
                LabelIDsAdded: [MAILBOX_LABEL_IDS.ARCHIVE],
            };

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [updateEvent],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            });

            const updatedMsg = state.elements[messageOne] as Message;
            expect(updatedMsg.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.INBOX);
            expect(updatedMsg.LabelIDs).toContain(MAILBOX_LABEL_IDS.ARCHIVE);
            expect(state.total[inboxContext]).toBe(9);
            expect(state.total[archiveContext]).toBe(6);
        });

        it('ignores toUpdate entries for elements not in state', () => {
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state = makeState({
                elements: {},
                total: { [inboxContext]: 10 },
            });

            const updateEvent = {
                ID: messageOne,
                LabelIDsRemoved: [MAILBOX_LABEL_IDS.INBOX],
                LabelIDsAdded: [MAILBOX_LABEL_IDS.ARCHIVE],
            };

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [updateEvent],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            });

            expect(state.total[inboxContext]).toBe(10);
        });

        it('adjusts unread context total when a message unread status changes in an event', () => {
            const unreadMsg = setupMessage({
                messageID: messageOne,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });
            const inboxUnreadContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                filter: { Unread: 1 },
            });
            state = makeState({
                elements: { [messageOne]: unreadMsg },
                total: { [inboxUnreadContext]: 5 },
            });

            // Event marks the message as read (Unread: 0)
            const updateEvent = {
                ID: messageOne,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 0,
            };

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [updateEvent],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            });

            expect(state.total[inboxUnreadContext]).toBe(4);
        });
    });

    describe('combined operations', () => {
        it('handles toCreate, toUpdate, and toDelete together', () => {
            const existingMsg = setupMessage({
                messageID: messageOne,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });
            const msgToDelete = setupMessage({
                messageID: messageTwo,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });
            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state = makeState({
                elements: { [messageOne]: existingMsg, [messageTwo]: msgToDelete },
                total: { [inboxContext]: 10 },
            });

            const newMessage = setupMessage({
                messageID: messageThree,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX],
            });
            const updateEvent = {
                ID: messageOne,
                LabelIDsRemoved: [MAILBOX_LABEL_IDS.INBOX],
                LabelIDsAdded: [MAILBOX_LABEL_IDS.ARCHIVE],
            };

            eventUpdatesPending(
                state,

                {
                    type: 'elements/eventUpdates/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            toCreate: [newMessage],
                            toUpdate: [updateEvent],
                            toLoad: [],
                            toDelete: [messageTwo],
                            conversationMode: false,
                        },
                    },
                }
            );

            // +1 (create msg-3) - 1 (update msg-1 out of inbox) - 1 (delete msg-2) = -1
            expect(state.total[inboxContext]).toBe(9);
        });
    });

    describe('conversation mode', () => {
        it('increases total when a new conversation is added to a cached context', () => {
            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            state = makeState({
                total: { [inboxContext]: 5 },
                params: {
                    ...state.params,
                    conversationMode: true,
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                },
            });

            const newConversation = setupConversation({
                conversationID: CONVERSATION_ID,
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                ],
                numMessages: 1,
                numUnread: 0,
                numAttachments: 0,
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [newConversation],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: true,
                    },
                },
            });

            expect(state.total[inboxContext]).toBe(6);
        });

        it('decreases total when a conversation is deleted from a cached context', () => {
            const conversation = setupConversation({
                conversationID: CONVERSATION_ID,
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                ],
                numMessages: 1,
                numUnread: 0,
                numAttachments: 0,
            });
            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            state = makeState({
                params: {
                    ...state.params,
                    conversationMode: true,
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                },
                elements: { [CONVERSATION_ID]: conversation },
                total: { [inboxContext]: 5 },
            });

            eventUpdatesPending(state, {
                type: 'elements/eventUpdates/pending',
                payload: undefined,
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [CONVERSATION_ID],
                        conversationMode: true,
                    },
                },
            });

            expect(state.elements[CONVERSATION_ID]).toBeUndefined();
            expect(state.total[inboxContext]).toBe(4);
        });
    });
});

describe('eventUpdatesFulfilled', () => {
    let state: Draft<ElementsState>;

    beforeEach(() => {
        state = makeState();
    });

    it('does not change total when the loaded element retains the same label context', () => {
        const inboxMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        state = makeState({
            elements: { [messageOne]: inboxMsg },
            total: { [inboxContext]: 10 },
        });

        // Full element data arrives with same label
        const fullElement = { ...inboxMsg };

        eventUpdatesFulfilled(state, {
            type: 'elements/eventUpdates/fulfilled',
            payload: [fullElement],
            meta: {
                arg: {
                    toCreate: [],
                    toUpdate: [],
                    toLoad: [],
                    toDelete: [],
                    conversationMode: false,
                },
            },
        });

        expect(state.total[inboxContext]).toBe(10);
    });

    it('increases total when the loaded element is added to a cached context', () => {
        // Element was not in state before (e.g. a newly created element from toLoad)
        const newMessage = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        state = makeState({
            elements: {},
            total: { [inboxContext]: 10 },
        });

        eventUpdatesFulfilled(state, {
            type: 'elements/eventUpdates/fulfilled',
            payload: [newMessage],
            meta: {
                arg: {
                    toCreate: [],
                    toUpdate: [],
                    toLoad: [],
                    toDelete: [],
                    conversationMode: false,
                },
            },
        });

        expect(state.elements[messageOne]).toBeDefined();
        expect(state.total[inboxContext]).toBe(11);
    });

    it('decreases inbox total when the loaded element has lost its inbox label', () => {
        // Element was previously in inbox in state (e.g. from a prior optimistic update)
        const inboxMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });
        state = makeState({
            elements: { [messageOne]: inboxMsg },
            total: { [inboxContext]: 10, [archiveContext]: 5 },
        });

        // Server says the element is now in archive
        const serverElement = {
            ...inboxMsg,
            LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.ALL_MAIL],
        } as unknown as Message;

        eventUpdatesFulfilled(state, {
            type: 'elements/eventUpdates/fulfilled',
            payload: [serverElement],
            meta: {
                arg: {
                    toCreate: [],
                    toUpdate: [],
                    toLoad: [],
                    toDelete: [],
                    conversationMode: false,
                },
            },
        });

        expect((state.elements[messageOne] as Message).LabelIDs).toContain(MAILBOX_LABEL_IDS.ARCHIVE);
        expect((state.elements[messageOne] as Message).LabelIDs).not.toContain(MAILBOX_LABEL_IDS.INBOX);
        expect(state.total[inboxContext]).toBe(9);
        expect(state.total[archiveContext]).toBe(6);
    });

    it('filters out undefined elements from payload without crashing', () => {
        const inboxMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        state = makeState({
            elements: { [messageOne]: inboxMsg },
            total: { [inboxContext]: 10 },
        });

        expect(() =>
            eventUpdatesFulfilled(state, {
                type: 'elements/eventUpdates/fulfilled',
                payload: [undefined, inboxMsg],
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            })
        ).not.toThrow();

        expect(state.total[inboxContext]).toBe(10);
    });

    it('handles an empty payload without changing any totals', () => {
        const inboxMsg = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        state = makeState({
            elements: { [messageOne]: inboxMsg },
            total: { [inboxContext]: 10 },
        });

        eventUpdatesFulfilled(state, {
            type: 'elements/eventUpdates/fulfilled',
            payload: [],
            meta: {
                arg: {
                    toCreate: [],
                    toUpdate: [],
                    toLoad: [],
                    toDelete: [],
                    conversationMode: false,
                },
            },
        });

        expect(state.total[inboxContext]).toBe(10);
    });

    it('updates totals for multiple elements in a single fulfilled action', () => {
        const inboxMsg1 = setupMessage({
            messageID: messageOne,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxMsg2 = setupMessage({
            messageID: messageTwo,
            unreadState: 'read',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX],
        });
        const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
        const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });
        state = makeState({
            elements: { [messageOne]: inboxMsg1, [messageTwo]: inboxMsg2 },
            total: { [inboxContext]: 10, [archiveContext]: 5 },
        });

        // Both messages have been moved to archive by the server
        const serverMsg1 = { ...inboxMsg1, LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] } as unknown as Message;
        const serverMsg2 = { ...inboxMsg2, LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE] } as unknown as Message;

        eventUpdatesFulfilled(state, {
            type: 'elements/eventUpdates/fulfilled',
            payload: [serverMsg1, serverMsg2],
            meta: {
                arg: {
                    toCreate: [],
                    toUpdate: [],
                    toLoad: [],
                    toDelete: [],
                    conversationMode: false,
                },
            },
        });

        expect(state.total[inboxContext]).toBe(8); // 10 - 2
        expect(state.total[archiveContext]).toBe(7); // 5 + 2
    });

    describe('event loop race condition scenario', () => {
        it('correctly updates total when fulfilled data differs from pending data', () => {
            // Scenario: event-loop pending phase adds a new conversation (optimistically from toCreate)
            // Fulfilled phase receives the full element – which may have slightly different labels
            const conversation = setupConversation({
                conversationID: CONVERSATION_ID,
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                ],
                numMessages: 1,
                numUnread: 0,
                numAttachments: 0,
            });
            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            state = makeState({
                elements: { [CONVERSATION_ID]: conversation },
                total: { [inboxContext]: 11 },
                params: {
                    ...state.params,
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    conversationMode: true,
                },
            });

            const serverConversation = setupConversation({
                conversationID: CONVERSATION_ID,
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                ],
                numMessages: 1,
                numUnread: 0,
                numAttachments: 0,
            });

            eventUpdatesFulfilled(state, {
                type: 'elements/eventUpdates/fulfilled',
                payload: [serverConversation],
                meta: {
                    arg: {
                        toCreate: [],
                        toUpdate: [],
                        toLoad: [],
                        toDelete: [],
                        conversationMode: false,
                    },
                },
            });

            expect(state.total[inboxContext]).toBe(11);
        });
    });
});
