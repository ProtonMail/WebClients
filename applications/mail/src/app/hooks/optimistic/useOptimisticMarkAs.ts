import { useHistory } from 'react-router-dom';

import { useHandler } from '@proton/components';
import {
    conversationCountsActions,
    messageCountsActions,
    selectConversationCounts,
    selectMessageCounts,
} from '@proton/mail';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { isSystemLabel } from 'proton-mail/helpers/labels';
import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';

import { updateCountersForMarkAs } from '../../helpers/counter';
import { isUnread, isMessage as testIsMessage } from '../../helpers/elements';
import { isConversationMode } from '../../helpers/mailSettings';
import { applyMarkAsChangesOnMessage } from '../../helpers/message/messages';
import { isElementReminded } from '../../helpers/snooze';
import useMailModel from '../../hooks/useMailModel';
import { Conversation } from '../../models/conversation';
import { Element } from '../../models/element';
import {
    optimisticMarkAsConversation,
    optimisticMarkAsConversationMessages,
} from '../../store/conversations/conversationsActions';
import { optimisticMarkAs as optimisticMarkAsElementAction } from '../../store/elements/elementsActions';
import { optimisticMarkAs as optimisticMarkAsMessageAction } from '../../store/messages/optimistic/messagesOptimisticActions';
import { useGetConversation } from '../conversation/useConversation';
import { useGetElementByID } from '../mailbox/useElements';

export type MarkAsChanges = { status: MARK_AS_STATUS; displaySnoozedReminder?: boolean };

const computeRollbackMarkAsChanges = (element: Element, labelID: string, changes: MarkAsChanges) => {
    const isElementUnread = isUnread(element, labelID);
    const displaySnoozedReminder = isElementReminded(element);
    const { status } = changes;

    // If same status nothing changes
    if ((isElementUnread && status === MARK_AS_STATUS.UNREAD) || (!isElementUnread && status === MARK_AS_STATUS.READ)) {
        return changes;
    }

    return {
        status: isElementUnread ? MARK_AS_STATUS.UNREAD : MARK_AS_STATUS.READ,
        displaySnoozedReminder,
    };
};

export const applyMarkAsChangesOnConversation = (
    conversation: Conversation,
    labelID: string,
    { status, displaySnoozedReminder }: MarkAsChanges
) => {
    const { NumUnread = 0, Labels = [] } = conversation;
    const { ContextNumUnread = 0 } = Labels.find(({ ID }) => ID === labelID) || {};
    const updatedNumUnread =
        status === MARK_AS_STATUS.UNREAD ? NumUnread + 1 : Math.max(NumUnread - ContextNumUnread, 0);
    const updatedContextNumUnread = status === MARK_AS_STATUS.UNREAD ? ContextNumUnread + 1 : 0;
    const updatedLabels = Labels.map((label) =>
        label.ID === labelID || isSystemLabel(label.ID)
            ? {
                  ...label,
                  ContextNumUnread: updatedContextNumUnread,
              }
            : label
    );

    return {
        ...conversation,
        DisplaySnoozedReminder: displaySnoozedReminder,
        NumUnread: updatedNumUnread,
        ContextNumUnread: updatedContextNumUnread,
        Labels: updatedLabels,
    };
};

// Here only one message is marked as read/unread
const applyMarkAsChangesOnConversationWithMessages = (
    conversation: Conversation,
    labelID: string,
    { status, displaySnoozedReminder }: MarkAsChanges
) => {
    const { NumUnread = 0, Labels = [] } = conversation;
    const { ContextNumUnread = 0 } = Labels.find(({ ID }) => ID === labelID) || {};
    const updatedNumUnread = status === MARK_AS_STATUS.UNREAD ? NumUnread + 1 : Math.max(NumUnread - 1, 0);
    const updatedContextNumUnread =
        status === MARK_AS_STATUS.UNREAD ? ContextNumUnread + 1 : Math.max(ContextNumUnread - 1, 0);
    const updatedLabels = Labels.map((label) =>
        label.ID === labelID || isSystemLabel(label.ID)
            ? {
                  ...label,
                  ContextNumUnread: updatedContextNumUnread,
              }
            : label
    );

    return {
        ...conversation,
        DisplaySnoozedReminder: displaySnoozedReminder,
        NumUnread: updatedNumUnread,
        ContextNumUnread: updatedContextNumUnread,
        Labels: updatedLabels,
    };
};

export const useOptimisticMarkAs = () => {
    const mailStore = useMailStore();
    const dispatch = useMailDispatch();
    const getElementByID = useGetElementByID();
    const mailSettings = useMailModel('MailSettings');
    const history = useHistory();
    const getConversation = useGetConversation();

    const optimisticMarkAs = useHandler(
        (elements: Element[], labelID: string, inputChanges: MarkAsChanges | MarkAsChanges[]) => {
            const rollbackChanges = [] as { element: Element; changes: MarkAsChanges }[];
            const updatedElements = [] as Element[];
            const updatedElementsChangeRollback: MarkAsChanges[] = [];
            let { value: conversationCounters = [] } = selectConversationCounts(mailStore.getState());
            let { value: messageCounters = [] } = selectMessageCounts(mailStore.getState());
            const isRollback = Array.isArray(inputChanges);

            // Counters can be undefined if they are not yet fetched
            if (!messageCounters || !conversationCounters) {
                return;
            }

            elements.forEach((element, index) => {
                const changes = isRollback ? inputChanges[index] : inputChanges;
                rollbackChanges.push({ element, changes: computeRollbackMarkAsChanges(element, labelID, changes) });

                if (testIsMessage(element)) {
                    const message = element as Message;

                    dispatch(optimisticMarkAsMessageAction({ ID: message.ID, changes }));

                    // Update in conversation cache
                    const conversationState = getConversation(message.ConversationID);
                    if (conversationState && conversationState.Conversation) {
                        const conversation = conversationState.Conversation;
                        const updatedConversation = applyMarkAsChangesOnConversationWithMessages(
                            conversation,
                            labelID,
                            changes
                        );

                        dispatch(
                            optimisticMarkAsConversationMessages({
                                ID: message.ConversationID,
                                messageID: message.ID,
                                updatedConversation,
                                changes,
                            })
                        );

                        // Update conversation count when the conversation is loaded
                        conversationCounters = updateCountersForMarkAs(
                            conversation,
                            updatedConversation,
                            conversationCounters
                        );
                    }

                    // Updates in elements cache if message mode
                    const messageElement = getElementByID(message.ID);
                    if (messageElement && messageElement.ID) {
                        const updatedMessage = applyMarkAsChangesOnMessage(messageElement as Message, changes);
                        updatedElements.push(updatedMessage);
                        if (isRollback) {
                            updatedElementsChangeRollback.push(inputChanges[index]);
                        }

                        // Update counters
                        messageCounters = updateCountersForMarkAs(message, updatedMessage, messageCounters);
                    }

                    // Update in elements cache if conversation mode
                    const conversationElement = getElementByID(message.ConversationID);
                    if (conversationElement && conversationElement.ID) {
                        updatedElements.push(
                            applyMarkAsChangesOnConversationWithMessages(conversationElement, labelID, changes)
                        );
                        if (isRollback) {
                            updatedElementsChangeRollback.push(inputChanges[index]);
                        }
                    }
                } else {
                    // isConversation
                    const conversation = element as RequireSome<Conversation, 'ID'>;

                    // Update in conversation cache
                    dispatch(optimisticMarkAsConversation({ ID: conversation.ID, labelID, changes }));

                    // Update in elements cache if conversation mode
                    const conversationElement = getElementByID(conversation.ID);
                    if (conversationElement && conversationElement.ID) {
                        const updatedConversation = applyMarkAsChangesOnConversation(
                            conversationElement,
                            labelID,
                            changes
                        );
                        updatedElements.push(updatedConversation);
                        if (isRollback) {
                            updatedElementsChangeRollback.push(inputChanges[index]);
                        }

                        // Update counters
                        conversationCounters = updateCountersForMarkAs(
                            conversationElement,
                            updatedConversation,
                            conversationCounters
                        );
                    }

                    // Update messages from the conversation (if loaded)
                    if (changes.status === MARK_AS_STATUS.READ) {
                        const messages = getConversation(conversation.ID)?.Messages;
                        messages?.forEach((message) => {
                            if (!message.LabelIDs.find((id) => id === labelID)) {
                                return;
                            }

                            dispatch(optimisticMarkAsMessageAction({ ID: message.ID, changes }));
                        });
                    }
                }
            });

            if (updatedElements.length) {
                // When changing the read / unread status of an element
                // We want them to stay on the current filter even if it doesn't match the filter anymore
                // So we manually update the elements cache to mark these ids to bypass the filter logic
                // This will last as long as the cache is not reset (cf useElements shouldResetElementsState)
                const conversationMode = isConversationMode(labelID, mailSettings, history.location);
                if (isRollback) {
                    // For rollbacks, we cannot use a single mark as status.
                    // The selection could be mark as read but an element was already read, so we don't want to unread it
                    // TODO improve in two dispatchs => marks a read / mark as unread elements
                    updatedElements.forEach((element, index) => {
                        dispatch(
                            optimisticMarkAsElementAction({
                                elements: [element],
                                bypass: true,
                                conversationMode,
                                markAsStatus: updatedElementsChangeRollback[index].status,
                            })
                        );
                    });
                } else {
                    dispatch(
                        optimisticMarkAsElementAction({
                            elements: updatedElements,
                            bypass: true,
                            conversationMode,
                            markAsStatus: inputChanges.status,
                        })
                    );
                }
            }

            mailStore.dispatch(messageCountsActions.set(messageCounters));
            mailStore.dispatch(conversationCountsActions.set(conversationCounters));

            return () => {
                // Building elements and changes so that we do the optimistic update in a single call
                const { elements, inputChanges } = rollbackChanges.reduce<{
                    elements: Element[];
                    inputChanges: MarkAsChanges[];
                }>(
                    (acc, rollbackChange) => {
                        acc.elements.push(rollbackChange.element);
                        acc.inputChanges.push(rollbackChange.changes);
                        return acc;
                    },
                    { elements: [], inputChanges: [] }
                );

                optimisticMarkAs(elements, labelID, inputChanges);
            };
        }
    );

    return optimisticMarkAs;
};
