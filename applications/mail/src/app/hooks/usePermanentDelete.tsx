import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c, msgid } from 'ttag';

import {
    AlertModal,
    Button,
    ErrorButton,
    useApi,
    useEventManager,
    useModalState,
    useNotifications,
} from '@proton/components';
import { deleteConversations } from '@proton/shared/lib/api/conversations';
import { deleteMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { isConversation } from '../helpers/elements';
import { backendActionFinished, backendActionStarted } from '../logic/elements/elementsActions';
import { useGetElementsFromIDs } from './mailbox/useElements';
import useOptimisticDelete from './optimistic/useOptimisticDelete';

const { DRAFTS, ALL_DRAFTS } = MAILBOX_LABEL_IDS;

export const getDeleteTitle = (
    isDraft: boolean,
    isConversationMode: boolean,
    count: number,
    totalMessages?: number
) => {
    if (isDraft) {
        if (count === 1) {
            // translator: deleting strictly 1 draft
            return c('Title').t`Delete draft`;
        }
        // translator: number of drafts to delete, the variable is a positive integer (written in digits) always greater than 1
        return c('Title').ngettext(msgid`Delete ${count} draft`, `Delete ${count} drafts`, count);
    }

    if (isConversationMode) {
        if (count === 1) {
            if (totalMessages === 1) {
                // translator: deleting strictly 1 message
                return c('Title').t`Delete message`;
            }
            // translator: deleting strictly 1 conversation
            return c('Title').t`Delete conversation`;
        }
        // translator: number of conversations to delete, the variable is a positive integer (written in digits) always greater than 1
        return c('Title').ngettext(msgid`Delete ${count} conversation`, `Delete ${count} conversations`, count);
    }

    if (count === 1) {
        // translator: deleting strictly 1 message
        return c('Title').t`Delete message`;
    }
    // translator: number of messages to delete, the variable is a positive integer (written in digits) always greater than 1
    return c('Title').ngettext(msgid`Delete ${count} message`, `Delete ${count} messages`, count);
};

export const getModalText = (isDraft: boolean, isConversationMode: boolean, count: number, totalMessages?: number) => {
    if (isDraft) {
        if (count === 1) {
            // translator: deleting strictly 1 draft
            return c('Info').t`Are you sure you want to permanently delete this draft?`;
        }
        // translator: number of drafts to delete, the variable is a positive integer (written in digits) always greater than 1
        return c('Info').ngettext(
            msgid`Are you sure you want to permanently delete ${count} draft?`,
            `Are you sure you want to permanently delete ${count} drafts?`,
            count
        );
    }

    if (isConversationMode) {
        if (count === 1) {
            if (totalMessages === 1) {
                // translator: deleting strictly 1 message
                return c('Info').t`Are you sure you want to permanently delete this message?`;
            }
            // translator: deleting strictly 1 conversation
            return c('Info').t`Are you sure you want to permanently delete this conversation?`;
        }
        // translator: number of conversations to delete, the variable is a positive integer (written in digits) always greater than 1
        return c('Info').ngettext(
            msgid`Are you sure you want to permanently delete ${count} conversation?`,
            `Are you sure you want to permanently delete ${count} conversations?`,
            count
        );
    }

    if (count === 1) {
        // translator: deleting strictly 1 message
        return c('Info').t`Are you sure you want to permanently delete this message?`;
    }
    // translator: number of messages to delete, the variable is a positive integer (written in digits) always greater than 1
    return c('Info').ngettext(
        msgid`Are you sure you want to permanently delete ${count} message?`,
        `Are you sure you want to permanently delete ${count} messages?`,
        count
    );
};

export const getNotificationText = (
    isDraft: boolean,
    isConversationMode: boolean,
    count: number,
    totalMessages?: number
) => {
    if (isDraft) {
        if (count === 1) {
            // translator: deleting strictly 1 draft
            return c('Success').t`Draft deleted`;
        }
        // translator: number of drafts to delete, the variable is a positive integer (written in digits) always greater than 1
        return c('Success').ngettext(msgid`${count} draft deleted`, `${count} drafts deleted`, count);
    }

    if (isConversationMode) {
        if (count === 1) {
            if (totalMessages === 1) {
                // translator: deleting strictly 1 message
                return c('Success').t`Message deleted`;
            }
            // translator: deleting strictly 1 conversation
            return c('Success').t`Conversation deleted`;
        }
        // translator: number of conversations to delete, the variable is a positive integer (written in digits) always greater than 1
        return c('Success').ngettext(msgid`${count} conversation deleted`, `${count} conversations deleted`, count);
    }

    if (count === 1) {
        // translator: deleting strictly 1 message
        return c('Success').t`Message deleted`;
    }
    // translator: number of messages to delete, the variable is a positive integer (written in digits) always greater than 1
    return c('Success').ngettext(msgid`${count} message deleted`, `${count} messages deleted`, count);
};

export const usePermanentDelete = (labelID: string) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const getElementsFromIDs = useGetElementsFromIDs();
    const optimisticDelete = useOptimisticDelete();
    const dispatch = useDispatch();

    const [selectedIDs, setSelectedIDs] = useState<string[]>([]);
    const [deleteModalProps, setDeleteModalOpen] = useModalState();

    const draft = labelID === DRAFTS || labelID === ALL_DRAFTS;
    const selectedItemsCount = useMemo(() => {
        return selectedIDs.length;
    }, [selectedIDs]);
    const elements = useMemo(() => {
        return getElementsFromIDs(selectedIDs);
    }, [selectedIDs]);

    // If the selected item is a conversation, it may contain more than one message.
    // We need to know how much messages we want to delete in order to display a specific message if we only delete one of them
    const totalMessages = useMemo(() => {
        return elements.reduce((total, element) => {
            return total + (('ContextNumMessages' in element && element.ContextNumMessages) || 0);
        }, 0);
    }, [elements]);
    const conversationMode = isConversation(elements[0]);

    const handleSubmit = async () => {
        deleteModalProps.onClose();
        let rollback = () => {};

        try {
            dispatch(backendActionStarted());
            rollback = optimisticDelete(elements, labelID);
            const action = conversationMode ? deleteConversations(selectedIDs, labelID) : deleteMessages(selectedIDs);
            await api(action);
            const notificationText = getNotificationText(draft, conversationMode, selectedItemsCount, totalMessages);
            createNotification({ text: notificationText });
        } catch {
            rollback();
        } finally {
            dispatch(backendActionFinished());
        }
        await call();
    };

    const modal = (
        <AlertModal
            title={getDeleteTitle(draft, conversationMode, selectedItemsCount, totalMessages)}
            buttons={[
                <ErrorButton onClick={handleSubmit} data-testid="permanent-delete-modal:submit">{c('Action')
                    .t`Delete`}</ErrorButton>,
                <Button onClick={deleteModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...deleteModalProps}
        >
            {getModalText(draft, conversationMode, selectedItemsCount, totalMessages)}
        </AlertModal>
    );

    const handleDelete = async (selectedIDs: string[]) => {
        setSelectedIDs(selectedIDs);
        setDeleteModalOpen(true);
    };

    return { handleDelete, modal };
};
