import { createAsyncThunk } from '@reduxjs/toolkit';

import { conversationCountsActions, messageCountsActions } from '@proton/mail';
import {
    markConversationsAsRead as markConversationsAsReadApi,
    markConversationsAsUnread as markConversationsAsUnreadApi,
} from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { markMessageAsRead, markMessageAsUnread } from '@proton/shared/lib/api/messages';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import UndoActionNotification from 'proton-mail/components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from 'proton-mail/constants';
import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';

import type { MailThunkExtra } from '../store';
import type { MailThunkArguments } from '../thunk';
import { getNotificationTextMarked } from './mailboxHelpers';

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
                                    filteredTokens.map((token) => extra.api({ ...undoActions(token), silence: true }))
                                );
                                await extra.eventManager.call();
                            };
                            void undo();
                            // Throw an error to undo the action optimistically
                            throw new Error('Undo action');
                        }}
                    >
                        {notificationText}
                    </UndoActionNotification>
                ),
                expiration: SUCCESS_NOTIFICATION_EXPIRATION,
            });
        }

        result = await promise;
    } finally {
        extra.eventManager.start();

        // We force-fetch events after the action is completed to ensure the UI is updated in cases where the optimistic update cannot be reliably predicted
        if (finallyFetchEvents) {
            await extra.eventManager.call();
        }
    }
    return result;
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
