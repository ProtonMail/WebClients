import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation, ConversationLabel } from 'proton-mail/models/conversation';
import { labelMessagesPending } from 'proton-mail/store/elements/elementsReducers';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    CONVERSATION_ID,
    CUSTOM_LABEL_ID1,
    MESSAGE_ID,
    customFolders,
    customLabels,
    expectConversationLabelsSameArray,
    expectMessagesLabelsSameArray,
    setupConversation,
    setupMessage,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

describe('labelMessagesPending', () => {
    let testState: Draft<ElementsState>;

    beforeEach(() => {
        testState = {
            elements: {},
            total: {},
            params: {
                filter: {},
                conversationMode: true,
            },
        } as unknown as Draft<ElementsState>;
    });

    describe('Labels are removed when move to TRASH or SPAM', () => {
        it('should remove STARRED if conversation is moved to TRASH', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
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
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.TRASH,
                MAILBOX_LABEL_IDS.ALL_MAIL,
            ]);
        });

        it('should remove Custom label if conversation is moved to TRASH', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
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
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.TRASH,
                MAILBOX_LABEL_IDS.ALL_MAIL,
            ]);
        });

        it('should remove ALMOST_ALL_MAIL if conversation is moved to TRASH', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
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
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.TRASH,
                MAILBOX_LABEL_IDS.ALL_MAIL,
            ]);
        });

        it('should remove STARRED if conversation is moved to SPAM', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.SPAM,
                MAILBOX_LABEL_IDS.ALL_MAIL,
            ]);
        });

        it('should remove Custom label if conversation is moved to SPAM', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.SPAM,
                MAILBOX_LABEL_IDS.ALL_MAIL,
            ]);
        });

        it('should remove ALMOST_ALL_MAIL if conversation is moved to SPAM', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.SPAM,
                MAILBOX_LABEL_IDS.ALL_MAIL,
            ]);
        });
    });

    describe('Unmodifiable labels should not be updated', () => {
        it('should not update unmodifiable labels', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.SENT,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_SENT,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.ARCHIVE,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.ALL_SENT,
            ]);
        });
    });

    describe('Move to INBOX', () => {
        it('should move to INBOX', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            ]);
        });
    });

    describe('Move to a category', () => {
        it('should move to the category', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            ]);
        });
    });

    describe('Move to SENT', () => {
        it('should move to SENT', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_SENT,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.SENT,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.ALL_SENT,
            ]);
        });
    });

    describe('Move to DRAFTS', () => {
        it('should move to DRAFTS', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_DRAFTS,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.DRAFTS,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.ALL_DRAFTS,
            ]);
        });
    });

    describe('Move to label', () => {
        it('should move to STARRED', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_DRAFTS,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.ARCHIVE,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.ALL_DRAFTS,
                MAILBOX_LABEL_IDS.STARRED,
            ]);
        });

        it('should move to custom label', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_DRAFTS,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: CUSTOM_LABEL_ID1,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.ARCHIVE,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.ALL_DRAFTS,
                CUSTOM_LABEL_ID1,
            ]);
        });
    });

    describe('Default scenario', () => {
        it('should move message to the target label', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            ]);
        });

        it('should move message to the target label and keep STARRED', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.STARRED,
            ]);
        });

        it('should move message to the target label and keep custom label', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                CUSTOM_LABEL_ID1,
            ]);
        });

        it('should move message to the target label and keep category', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
            ]);
        });
    });

    describe('Add elements back to ALMOST_ALL_MAIL', () => {
        it('should add back TRASH messages to ALMOST_ALL_MAIL', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.TRASH,
                        destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            ]);
        });

        it('should add back SPAM messages to ALMOST_ALL_MAIL', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.SPAM, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.SPAM,
                        destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            ]);
        });
    });

    describe('Conversation from message in element state are updated', () => {
        describe('Move to TRASH', () => {
            it('should decrease ALMOST_ALL_MAIL from the conversation in element state when moving message to TRASH', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
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
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(0);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(1);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ]);
            });

            it('should decrease ALL_MAIL unread from the conversation in element state when moving message to TRASH', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
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
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(0);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(1);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ]);
            });

            it('should decrease STARRED from the conversation in element state when moving message to TRASH', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        MAILBOX_LABEL_IDS.STARRED,
                    ],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.STARRED,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
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
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(0);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(1);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ]);
            });

            it('should decrease Custom label from the conversation in element state when moving message to TRASH', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        CUSTOM_LABEL_ID1,
                    ],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
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
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(0);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(1);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 1, ContextNumUnread: 1, ContextNumAttachments: 0 },
                ]);
            });

            it('should not decrease category from the conversation in element state when moving message to TRASH', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
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
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(0);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(1);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ]);
            });
        });

        describe('Move out from TRASH or SPAM', () => {
            it('should update ALMOST_ALL_MAIL from the conversation when moving out from TRASH', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.TRASH],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 1,
                            ContextNumUnread: 1,
                            ContextNumAttachments: 0,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.TRASH,
                            ContextNumMessages: 1,
                            ContextNumUnread: 1,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 1,
                            ContextNumUnread: 1,
                            ContextNumAttachments: 0,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
                    type: 'mailbox/labelMessages',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages: [message],
                            sourceLabelID: MAILBOX_LABEL_IDS.TRASH,
                            destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                            labels: customLabels,
                            folders: customFolders,
                        },
                    },
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(1);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(2);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ]);
            });

            it('should update ALMOST_ALL_MAIL from the conversation when moving out from SPAM', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.SPAM],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 1,
                            ContextNumUnread: 1,
                            ContextNumAttachments: 0,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.SPAM,
                            ContextNumMessages: 1,
                            ContextNumUnread: 1,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 1,
                            ContextNumUnread: 1,
                            ContextNumAttachments: 0,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
                    type: 'mailbox/labelMessages',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages: [message],
                            sourceLabelID: MAILBOX_LABEL_IDS.SPAM,
                            destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                            labels: customLabels,
                            folders: customFolders,
                        },
                    },
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(1);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(2);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ]);
            });
        });

        describe('Move to STARRED or custom label', () => {
            it('should not decrease source label from the conversation when moving to STARRED', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
                    type: 'mailbox/labelMessages',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages: [message],
                            sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                            destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                            labels: customLabels,
                            folders: customFolders,
                        },
                    },
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(1);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(2);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ]);
            });

            it('should not decrease source label from the conversation when moving to Custom label', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: CUSTOM_LABEL_ID1,
                            ContextNumMessages: 1,
                            ContextNumUnread: 1,
                            ContextNumAttachments: 0,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
                    type: 'mailbox/labelMessages',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages: [message],
                            sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                            destinationLabelID: CUSTOM_LABEL_ID1,
                            labels: customLabels,
                            folders: customFolders,
                        },
                    },
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(1);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(2);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: CUSTOM_LABEL_ID1,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ]);
            });
        });

        describe('Move to a category', () => {
            it('should decrease old category and increase new category from the conversation when moving to a Category', () => {
                const message = setupMessage({
                    messageID: MESSAGE_ID,
                    unreadState: 'unread',
                    labelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ],
                    attachments: [{ Name: 'att' }] as Attachment[],
                });

                const conversation = setupConversation({
                    conversationLabels: [
                        {
                            ID: MAILBOX_LABEL_IDS.INBOX,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                        {
                            ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                            ContextNumMessages: 2,
                            ContextNumUnread: 2,
                            ContextNumAttachments: 1,
                        },
                    ] as ConversationLabel[],
                    numMessages: 2,
                    numUnread: 2,
                    numAttachments: 1,
                });

                testState.elements = {
                    [CONVERSATION_ID]: conversation,
                    [MESSAGE_ID]: message,
                };

                labelMessagesPending(testState, {
                    type: 'mailbox/labelMessages',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages: [message],
                            sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                            destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                            labels: customLabels,
                            folders: customFolders,
                        },
                    },
                });

                const updatedMessage = testState.elements[MESSAGE_ID] as Message;
                expect(updatedMessage.Unread).toEqual(1);
                expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                ]);

                const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
                expect(updatedConversation.NumMessages).toBe(2);
                expect(updatedConversation.NumUnread).toBe(2);
                expect(updatedConversation.NumAttachments).toBe(1);
                expectConversationLabelsSameArray(updatedConversation.Labels, [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ]);
            });
        });
    });
});
