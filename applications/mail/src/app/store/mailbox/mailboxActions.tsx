import { createAsyncThunk } from '@reduxjs/toolkit';

import { conversationCountsActions, messageCountsActions } from '@proton/mail';
import {
    labelConversations as labelConversationsApi,
    markConversationsAsRead as markConversationsAsReadApi,
    markConversationsAsUnread as markConversationsAsUnreadApi,
    unlabelConversations as unlabelConversationsApi,
} from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import {
    labelMessages as labelMessagesApi,
    markMessageAsRead,
    markMessageAsUnread,
    unlabelMessages as unlabelMessagesApi,
} from '@proton/shared/lib/api/messages';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import UndoActionNotification from 'proton-mail/components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from 'proton-mail/constants';
import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';

import type { MailThunkExtra } from '../store';
import type { MailThunkArguments } from '../thunk';
import {
    getNotificationTextLabelAdded,
    getNotificationTextLabelRemoved,
    getNotificationTextMarked,
} from './mailboxHelpers';

const runAction = async ({
    extra,
    finallyFetchEvents,
    notificationText,
    elements,
    action,
}: {
    extra: MailThunkArguments;
    notificationText?: string;
    finallyFetchEvents?: boolean;
    elements: Element[];
    action: (chunk: Element[]) => any;
}) => {
    const promise = new Promise<PromiseSettledResult<string | undefined>[]>(async (resolve, reject) => {
        let result: PromiseSettledResult<string | undefined>[] = [];

        try {
            extra.eventManager.stop();

            const promise = runParallelChunkedActions({
                api: extra.api,
                items: elements,
                action,
            });

            if (notificationText) {
                extra.notificationManager.createNotification({
                    text: (
                        <UndoActionNotification
                            onUndo={() => {
                                const undo = async () => {
                                    const tokens = await promise;
                                    const filteredTokens = getFilteredUndoTokens(tokens);
                                    await Promise.all(
                                        filteredTokens.map((token) =>
                                            extra.api({ ...undoActions(token), silence: true })
                                        )
                                    );
                                    await extra.eventManager.call();
                                };
                                void undo();
                                // Reject the promise to undo the action optimistically (AsyncThunk: reject)
                                reject(new Error('Undo action'));
                            }}
                        >
                            {notificationText}
                        </UndoActionNotification>
                    ),
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }

            result = await promise;

            resolve(result);
        } catch (error) {
            reject(error);
        }
    });

    return promise.finally(async () => {
        extra.eventManager.start();

        // We force-fetch events after the action is completed to ensure the UI is updated in cases where the optimistic update cannot be reliably predicted
        if (finallyFetchEvents) {
            await extra.eventManager.call();
        }
    });
};

export const markMessagesAsRead = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    {
        elements: Element[];
        conversations: Conversation[];
        isEncryptedSearch: boolean;
        labelID: string;
        showSuccessNotification?: boolean;
    },
    MailThunkExtra
>(
    'mailbox/markMessagesAsRead',
    async (
        { elements, labelID, isEncryptedSearch, showSuccessNotification = true, conversations },
        { extra, dispatch }
    ) => {
        try {
            dispatch(messageCountsActions.markMessagesAsReadPending({ elements, labelID }));
            dispatch(conversationCountsActions.markMessagesAsReadPending({ elements, labelID, conversations }));
            const result = await runAction({
                extra,
                finallyFetchEvents: isEncryptedSearch,
                notificationText: showSuccessNotification
                    ? getNotificationTextMarked(false, elements.length, MARK_AS_STATUS.READ)
                    : undefined,
                elements,
                action: (chunk) => markMessageAsRead(chunk.map((element: Element) => element.ID)),
            });
            return result;
        } catch (error) {
            dispatch(messageCountsActions.markMessagesAsReadRejected({ elements, labelID }));
            dispatch(conversationCountsActions.markMessagesAsReadRejected({ elements, labelID, conversations }));
            throw error;
        }
    }
);

export const markMessagesAsUnread = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    {
        elements: Element[];
        conversations: Conversation[];
        isEncryptedSearch: boolean;
        labelID: string;
        showSuccessNotification?: boolean;
    },
    MailThunkExtra
>(
    'mailbox/markMessagesAsUnread',
    async (
        { elements, labelID, isEncryptedSearch, showSuccessNotification = true, conversations },
        { extra, dispatch }
    ) => {
        try {
            dispatch(messageCountsActions.markMessagesAsUnreadPending({ elements, labelID }));
            dispatch(conversationCountsActions.markMessagesAsUnreadPending({ elements, labelID, conversations }));
            const result = await runAction({
                extra,
                finallyFetchEvents: isEncryptedSearch,
                notificationText: showSuccessNotification
                    ? getNotificationTextMarked(true, elements.length, MARK_AS_STATUS.UNREAD)
                    : undefined,
                elements,
                action: (chunk) => markMessageAsUnread(chunk.map((element: Element) => element.ID)),
            });
            return result;
        } catch (error) {
            dispatch(messageCountsActions.markMessagesAsUnreadRejected({ elements, labelID }));
            dispatch(conversationCountsActions.markMessagesAsUnreadRejected({ elements, labelID, conversations }));
            throw error;
        }
    }
);

export const markConversationsAsRead = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    { elements: Element[]; labelID: string; isEncryptedSearch: boolean; showSuccessNotification?: boolean },
    MailThunkExtra
>(
    'mailbox/markConversationsAsRead',
    async ({ elements, labelID, isEncryptedSearch, showSuccessNotification = true }, { extra, dispatch }) => {
        try {
            dispatch(conversationCountsActions.markConversationsAsReadPending({ elements, labelID }));
            const result = await runAction({
                extra,
                finallyFetchEvents: isEncryptedSearch,
                notificationText: showSuccessNotification
                    ? getNotificationTextMarked(false, elements.length, MARK_AS_STATUS.READ)
                    : undefined,
                elements,
                action: (chunk) => markConversationsAsReadApi(chunk.map((element: Element) => element.ID)),
            });
            return result;
        } catch (error) {
            dispatch(conversationCountsActions.markConversationsAsReadRejected({ elements, labelID }));
            throw error;
        }
    }
);

export const markConversationsAsUnread = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    { elements: Element[]; labelID: string; isEncryptedSearch: boolean; showSuccessNotification?: boolean },
    MailThunkExtra
>(
    'mailbox/markConversationsAsUnread',
    async ({ elements, labelID, isEncryptedSearch, showSuccessNotification = true }, { extra, dispatch }) => {
        try {
            dispatch(conversationCountsActions.markConversationsAsUnreadPending({ elements, labelID }));
            const result = await runAction({
                extra,
                finallyFetchEvents: isEncryptedSearch,
                notificationText: showSuccessNotification
                    ? getNotificationTextMarked(true, elements.length, MARK_AS_STATUS.UNREAD)
                    : undefined,
                elements,
                action: (chunk) =>
                    markConversationsAsUnreadApi(
                        chunk.map((element: Element) => element.ID),
                        labelID
                    ),
            });
            return result;
        } catch (error) {
            dispatch(conversationCountsActions.markConversationsAsUnreadRejected({ elements, labelID }));
            throw error;
        }
    }
);

export const labelMessages = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    {
        elements: Message[];
        targetLabelID: string;
        isEncryptedSearch: boolean;
        showSuccessNotification?: boolean;
        labels: Label[];
        folders: Folder[];
    },
    MailThunkExtra
>(
    'mailbox/labelMessages',
    async (
        { elements, labels, folders, targetLabelID, isEncryptedSearch, showSuccessNotification = true },
        { extra, dispatch }
    ) => {
        try {
            dispatch(messageCountsActions.labelMessagesPending({ elements, targetLabelID, labels, folders }));
            const result = await runAction({
                extra,
                finallyFetchEvents: isEncryptedSearch,
                notificationText: showSuccessNotification
                    ? getNotificationTextLabelAdded(true, elements.length, targetLabelID, labels, folders)
                    : undefined,
                elements,
                action: (chunk) =>
                    labelMessagesApi({
                        IDs: chunk.map((element: Element) => element.ID),
                        LabelID: targetLabelID,
                        // SpamAction
                    }),
            });
            return result;
        } catch (error) {
            // TODO: handle rejection
            throw error;
        }
    }
);

export const unlabelMessages = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    {
        elements: Message[];
        targetLabelID: string;
        isEncryptedSearch: boolean;
        showSuccessNotification?: boolean;
        labels: Label[];
        folders: Folder[];
    },
    MailThunkExtra
>(
    'mailbox/unlabelMessages',
    async (
        { elements, labels, folders, targetLabelID, isEncryptedSearch, showSuccessNotification = true },
        { extra, dispatch }
    ) => {
        try {
            dispatch(messageCountsActions.unlabelMessagesPending({ elements, targetLabelID, labels, folders }));
            const result = await runAction({
                extra,
                finallyFetchEvents: isEncryptedSearch,
                notificationText: showSuccessNotification
                    ? getNotificationTextLabelRemoved(true, elements.length, targetLabelID, labels, folders)
                    : undefined,
                elements,
                action: (chunk) =>
                    unlabelMessagesApi({
                        IDs: chunk.map((element: Element) => element.ID),
                        LabelID: targetLabelID,
                    }),
            });
            return result;
        } catch (error) {
            // TODO: handle rejection
            throw error;
        }
    }
);

export const labelConversations = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    {
        conversations: Conversation[];
        targetLabelID: string;
        isEncryptedSearch: boolean;
        showSuccessNotification?: boolean;
        labels: Label[];
        folders: Folder[];
    },
    MailThunkExtra
>(
    'mailbox/labelConversations',
    async (
        { conversations, labels, folders, targetLabelID, isEncryptedSearch, showSuccessNotification = true },
        { extra }
    ) => {
        return runAction({
            extra,
            finallyFetchEvents: isEncryptedSearch,
            notificationText: showSuccessNotification
                ? getNotificationTextLabelAdded(false, conversations.length, targetLabelID, labels, folders)
                : undefined,
            elements: conversations,
            action: (chunk) =>
                labelConversationsApi({
                    IDs: chunk.map((conversation: Conversation) => conversation.ID),
                    LabelID: targetLabelID,
                    // SpamAction
                }),
        });
    }
);

export const unlabelConversations = createAsyncThunk<
    PromiseSettledResult<string | undefined>[],
    {
        conversations: Conversation[];
        targetLabelID: string;
        isEncryptedSearch: boolean;
        showSuccessNotification?: boolean;
        labels: Label[];
        folders: Folder[];
    },
    MailThunkExtra
>(
    'mailbox/unlabelConversations',
    async (
        { conversations, labels, folders, targetLabelID, isEncryptedSearch, showSuccessNotification = true },
        { extra }
    ) => {
        try {
            const result = await runAction({
                extra,
                finallyFetchEvents: isEncryptedSearch,
                notificationText: showSuccessNotification
                    ? getNotificationTextLabelRemoved(false, conversations.length, targetLabelID, labels, folders)
                    : undefined,
                elements: conversations,
                action: (chunk) =>
                    unlabelConversationsApi({
                        IDs: chunk.map((conversation: Conversation) => conversation.ID),
                        LabelID: targetLabelID,
                    }),
            });
            return result;
        } catch (error) {
            throw error;
        }
    }
);
