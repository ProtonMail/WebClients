import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { labelConversationsPending, labelMessagesPending, loadFulfilled, optimisticDelete } from '../elementsReducers';
import { newElementsState } from '../elementsSlice';
import type { ElementsState } from '../elementsTypes';
import {
    CONVERSATION_ID,
    MESSAGE_ID,
    customFolders,
    customLabels,
    generateElementContextIdentifier,
    setupConversation,
    setupMessage,
} from './elementsReducer.test.helpers';

describe('elementsReducers - deletedSinceLastLoad', () => {
    let state: Draft<ElementsState>;

    beforeEach(() => {
        state = newElementsState() as Draft<ElementsState>;
    });

    describe('optimisticDelete', () => {
        it('should increment deletedSinceLastLoad by the number of deleted elements', () => {
            optimisticDelete(state, {
                type: 'elements/optimistic/delete',
                payload: { elementIDs: ['1', '2', '3'] },
            });

            expect(state.deletedSinceLastLoad).toBe(3);
        });

        it('should accumulate across multiple deletes', () => {
            optimisticDelete(state, {
                type: 'elements/optimistic/delete',
                payload: { elementIDs: ['1', '2'] },
            });
            optimisticDelete(state, {
                type: 'elements/optimistic/delete',
                payload: { elementIDs: ['3'] },
            });

            expect(state.deletedSinceLastLoad).toBe(3);
        });
    });

    describe('labelMessagesPending', () => {
        it('should increment deletedSinceLastLoad when messages leave the current context', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });

            state.elements = { [MESSAGE_ID]: message };
            state.params.labelID = MAILBOX_LABEL_IDS.INBOX;
            state.params.conversationMode = false;

            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            state.total = { [inboxContext]: 1 };

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            } as any);

            expect(state.deletedSinceLastLoad).toBe(1);
        });
    });

    describe('labelConversationsPending', () => {
        it('should increment deletedSinceLastLoad when conversations leave the current context', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ],
                numUnread: 1,
                numMessages: 1,
                numAttachments: 0,
            });

            state.elements = { [CONVERSATION_ID]: conversation };
            state.params.labelID = MAILBOX_LABEL_IDS.INBOX;
            state.params.conversationMode = true;

            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            state.total = { [inboxContext]: 1 };

            labelConversationsPending(state, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            } as any);

            expect(state.deletedSinceLastLoad).toBe(1);
        });
    });

    describe('loadFulfilled', () => {
        const baseAction = {
            type: 'elements/load/fulfilled',
            meta: { arg: { page: 0, pageSize: 50, abortController: undefined } },
        };

        it('should reset deletedSinceLastLoad to 0 when the response is fresh (not stale)', () => {
            state.deletedSinceLastLoad = 5;

            loadFulfilled(state, {
                ...baseAction,
                payload: {
                    result: { Total: 10, Elements: [], Stale: 0, TasksRunning: [] },
                    taskRunning: { labelIDs: [], timeoutID: undefined },
                    params: state.params,
                },
            } as any);

            expect(state.deletedSinceLastLoad).toBe(0);
        });

        it('should keep deletedSinceLastLoad unchanged when the response is stale', () => {
            state.deletedSinceLastLoad = 5;

            loadFulfilled(state, {
                ...baseAction,
                payload: {
                    result: { Total: 10, Elements: [], Stale: 1, TasksRunning: [] },
                    taskRunning: { labelIDs: [], timeoutID: undefined },
                    params: state.params,
                },
            } as any);

            expect(state.deletedSinceLastLoad).toBe(5);
        });
    });
});
