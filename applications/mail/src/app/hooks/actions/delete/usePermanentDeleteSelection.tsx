import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt, useApi, useEventManager, useModalState, useNotifications } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { deleteConversations } from '@proton/shared/lib/api/conversations';
import { deleteMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import useListTelemetry, {
    ACTION_TYPE,
    numberSelectionElements,
} from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import useIsEncryptedSearch from 'proton-mail/hooks/useIsEncryptedSearch';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { isConversation } from '../../../helpers/elements';
import type { Element } from '../../../models/element';
import { backendActionFinished, backendActionStarted } from '../../../store/elements/elementsActions';
import { useGetElementsFromIDs } from '../../mailbox/useElements';
import useOptimisticDelete from '../../optimistic/useOptimisticDelete';
import { MOVE_BACK_ACTION_TYPES } from '../moveBackAction/interfaces';
import { useMoveBackAction } from '../moveBackAction/useMoveBackAction';

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

/**
 * If you need to use permanent delete on an element selection, prefer to use the hook "usePermanentDelete" with selectAll to false or undefined instead.
 */
export const usePermanentDeleteSelection = (labelID: string) => {
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const getElementsFromIDs = useGetElementsFromIDs();
    const optimisticDelete = useOptimisticDelete();
    const dispatch = useMailDispatch();
    const { sendSimpleActionReport } = useListTelemetry();
    const mailActionsChunkSize = useFeature(FeatureCode.MailActionsChunkSize).feature?.Value;
    const isES = useIsEncryptedSearch();

    const handleOnBackMoveAction = useMoveBackAction();

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

        try {
            dispatch(backendActionStarted());

            handleOnBackMoveAction({ type: MOVE_BACK_ACTION_TYPES.PERMANENT_DELETE, elements });

            await runParallelChunkedActions({
                api,
                items: elements,
                chunkSize: mailActionsChunkSize,
                action: (chunk: Element[]) => {
                    // Delete action is done performed on a list of IDs
                    const itemIDs = chunk.map((c: Element) => c.ID);
                    return conversationMode ? deleteConversations(itemIDs, labelID) : deleteMessages(itemIDs);
                },
                canUndo: false,
                // In permanent delete, we have no UndoToken. So if a chunk fails, we want to undo the part which failed only
                optimisticAction: (items) => optimisticDelete(items, labelID),
            });

            const notificationText = getNotificationText(draft, conversationMode, selectedItemsCount, totalMessages);
            createNotification({ text: notificationText });
        } catch (error: any) {
            createNotification({
                text: c('Error').t`Something went wrong. Please try again.`,
                type: 'error',
            });
        } finally {
            dispatch(backendActionFinished());
        }
        // Removed to avoid state conflicts (e.g. items being moved optimistically and re-appearing directly with API data)
        // However, if on ES, because there is no optimistic in the ES cache, so we want to get api updates as soon as possible
        if (isES) {
            await call();
        }
    };

    const deleteSelectionModal = (
        <Prompt
            title={getDeleteTitle(draft, conversationMode, selectedItemsCount, totalMessages)}
            buttons={[
                <Button color="danger" onClick={handleSubmit} data-testid="permanent-delete-modal:submit">{c('Action')
                    .t`Delete`}</Button>,
                <Button onClick={deleteModalProps.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...deleteModalProps}
        >
            {getModalText(draft, conversationMode, selectedItemsCount, totalMessages)}
        </Prompt>
    );

    const handleDeleteSelection = async (selectedIDs: string[], sourceAction: SOURCE_ACTION) => {
        setSelectedIDs(selectedIDs);
        sendSimpleActionReport({
            actionType: ACTION_TYPE.DELETE_PERMANENTLY,
            actionLocation: sourceAction,
            numberMessage: numberSelectionElements(selectedIDs.length),
        });
        setDeleteModalOpen(true);
    };

    return { handleDeleteSelection, deleteSelectionModal };
};
