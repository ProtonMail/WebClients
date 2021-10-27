import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { useCache, useHandler, useMailSettings } from '@proton/components';
import { ConversationCountsModel, MessageCountsModel } from '@proton/shared/lib/models';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { STATUS } from '@proton/shared/lib/models/cache';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Conversation } from '../../models/conversation';
import { Element } from '../../models/element';
import { isMessage as testIsMessage, isUnread } from '../../helpers/elements';
import { MARK_AS_STATUS } from '../useMarkAs';
import { CacheEntry } from '../../models/tools';
import { updateCountersForMarkAs } from '../../helpers/counter';
import { useGetElementByID } from '../mailbox/useElements';
import { optimisticMarkAs as optimisticMarkAsElementAction } from '../../logic/elements/elementsActions';
import {
    optimisticMarkAsConversation,
    optimisticMarkAsConversationMessages,
} from '../../logic/conversations/conversationsActions';
import { optimisticMarkAs as optimisticMarkAsMessageAction } from '../../logic/messages/optimistic/messagesOptimisticActions';
import { isConversationMode } from '../../helpers/mailSettings';
import { useGetConversation } from '../conversation/useConversation';
import { applyMarkAsChangesOnMessage } from '../../helpers/message/messages';

export type MarkAsChanges = { status: MARK_AS_STATUS };

const computeRollbackMarkAsChanges = (element: Element, labelID: string, changes: MarkAsChanges) => {
    const isElementUnread = isUnread(element, labelID);
    const { status } = changes;

    // If same status nothing changes
    if ((isElementUnread && status === MARK_AS_STATUS.UNREAD) || (!isElementUnread && status === MARK_AS_STATUS.READ)) {
        return changes;
    }

    return {
        status: isElementUnread ? MARK_AS_STATUS.UNREAD : MARK_AS_STATUS.READ,
    };
};

// const applyMarkAsChangesOnMessage = (message: Message, { status }: MarkAsChanges) => ({
//     ...message,
//     Unread: status === MARK_AS_STATUS.UNREAD ? 1 : 0,
// });

export const applyMarkAsChangesOnConversation = (
    conversation: Conversation,
    labelID: string,
    { status }: MarkAsChanges
) => {
    const { NumUnread = 0, Labels = [] } = conversation;
    const { ContextNumUnread = 0 } = Labels.find(({ ID }) => ID === labelID) || {};
    const updatedNumUnread =
        status === MARK_AS_STATUS.UNREAD ? NumUnread + 1 : Math.max(NumUnread - ContextNumUnread, 0);
    const updatedContextNumUnread = status === MARK_AS_STATUS.UNREAD ? ContextNumUnread + 1 : 0;
    const updatedLabels = Labels.map((label) =>
        label.ID === labelID
            ? {
                  ...label,
                  ContextNumUnread: updatedContextNumUnread,
              }
            : label
    );

    return {
        ...conversation,
        NumUnread: updatedNumUnread,
        ContextNumUnread: updatedContextNumUnread,
        Labels: updatedLabels,
    };
};

// Here only one message is marked as read/unread
const applyMarkAsChangesOnConversationWithMessages = (
    conversation: Conversation,
    labelID: string,
    { status }: MarkAsChanges
) => {
    const { NumUnread = 0, Labels = [] } = conversation;
    const { ContextNumUnread = 0 } = Labels.find(({ ID }) => ID === labelID) || {};
    const updatedNumUnread = status === MARK_AS_STATUS.UNREAD ? NumUnread + 1 : Math.max(NumUnread - 1, 0);
    const updatedContextNumUnread =
        status === MARK_AS_STATUS.UNREAD ? ContextNumUnread + 1 : Math.max(ContextNumUnread - 1, 0);
    const updatedLabels = Labels.map((label) =>
        label.ID === labelID
            ? {
                  ...label,
                  ContextNumUnread: updatedContextNumUnread,
              }
            : label
    );

    return {
        ...conversation,
        NumUnread: updatedNumUnread,
        ContextNumUnread: updatedContextNumUnread,
        Labels: updatedLabels,
    };
};

export const useOptimisticMarkAs = () => {
    const dispatch = useDispatch();
    const getElementByID = useGetElementByID();
    const globalCache = useCache();
    const [mailSettings] = useMailSettings();
    const history = useHistory();
    const getConversation = useGetConversation();

    const optimisticMarkAs = useHandler((elements: Element[], labelID: string, changes: MarkAsChanges) => {
        const rollbackChanges = [] as { element: Element; changes: MarkAsChanges }[];
        const updatedElements = [] as Element[];
        let { value: messageCounters } = globalCache.get(MessageCountsModel.key) as CacheEntry<LabelCount[]>;
        let { value: conversationCounters } = globalCache.get(ConversationCountsModel.key) as CacheEntry<LabelCount[]>;

        elements.forEach((element) => {
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

                    // Update counters
                    messageCounters = updateCountersForMarkAs(message, updatedMessage, messageCounters);
                }

                // Update in elements cache if conversation mode
                const conversationElement = getElementByID(message.ConversationID);
                if (conversationElement && conversationElement.ID) {
                    updatedElements.push(
                        applyMarkAsChangesOnConversationWithMessages(conversationElement, labelID, changes)
                    );
                }
            } else {
                // isConversation
                const conversation = element as RequireSome<Conversation, 'ID'>;

                // Update in conversation cache
                dispatch(optimisticMarkAsConversation({ ID: conversation.ID, labelID, changes }));

                // Update in elements cache if conversation mode
                const conversationElement = getElementByID(conversation.ID);
                if (conversationElement && conversationElement.ID) {
                    const updatedConversation = applyMarkAsChangesOnConversation(conversationElement, labelID, changes);
                    updatedElements.push(updatedConversation);

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
            // This will last as long as the cache is not reset (cf useElements shouldResetCache)
            const conversationMode = isConversationMode(labelID, mailSettings, history.location);
            dispatch(optimisticMarkAsElementAction({ elements: updatedElements, bypass: true, conversationMode }));
        }

        globalCache.set(MessageCountsModel.key, { value: messageCounters, status: STATUS.RESOLVED });
        globalCache.set(ConversationCountsModel.key, { value: conversationCounters, status: STATUS.RESOLVED });

        return () => {
            rollbackChanges.forEach(({ element, changes }) => optimisticMarkAs([element], labelID, changes));
        };
    });

    return optimisticMarkAs;
};
