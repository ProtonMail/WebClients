import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { useHandler } from 'react-components';

import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useGetElementsCache, useSetElementsCache } from '../useElementsCache';
import { Conversation } from '../../models/conversation';
import { Element } from '../../models/element';
import { Message } from '../../models/message';
import { useConversationCache } from '../../containers/ConversationProvider';
import { isMessage, isUnread } from '../../helpers/elements';
import { MARK_AS_STATUS } from '../useMarkAs';

type MarkAsChanges = { status: MARK_AS_STATUS };

const computeRollbackMarkAsChanges = (element: Element, labelID: string, changes: MarkAsChanges) => {
    const isElementUnread = isUnread(element, labelID);
    const { status } = changes;

    // If same status nothing changes
    if ((isElementUnread && status === MARK_AS_STATUS.UNREAD) || (!isElementUnread && status === MARK_AS_STATUS.READ)) {
        return changes;
    }

    return {
        status: isElementUnread ? MARK_AS_STATUS.UNREAD : MARK_AS_STATUS.READ
    };
};

const applyMarkAsChangesOnMessage = (message: Message, { status }: MarkAsChanges) => ({
    ...message,
    Unread: status === MARK_AS_STATUS.UNREAD ? 1 : 0
});

const applyMarkAsChangesOnWholeConversation = (
    conversation: Conversation,
    labelID: string,
    { status }: MarkAsChanges
) => {
    const { NumUnread = 0, ContextNumUnread = 0, Labels = [] } = conversation;

    const updatedNumUnread = status === MARK_AS_STATUS.UNREAD ? NumUnread + 1 : 0;
    const updatedContextNumUnread = status === MARK_AS_STATUS.UNREAD ? ContextNumUnread + 1 : 0;
    const updatedLabels = Labels.map((l) =>
        l.ID === labelID
            ? l
            : {
                  ...l,
                  ContextNumUnread: updatedContextNumUnread
              }
    );

    return {
        ...conversation,
        NumUnread: updatedNumUnread,
        ContextNumUnread: updatedContextNumUnread,
        Labels: updatedLabels
    };
};

const applySingleMarkAsChangesOnConversation = (
    conversation: Conversation,
    labelID: string,
    { status }: MarkAsChanges
) => {
    const { ContextNumUnread = 0, NumUnread = 0, Labels = [] } = conversation;

    const updatedNumUnread = status === MARK_AS_STATUS.UNREAD ? NumUnread + 1 : Math.max(NumUnread - 1, 0);
    const updatedContextNumUnread =
        status === MARK_AS_STATUS.UNREAD ? ContextNumUnread + 1 : Math.max(ContextNumUnread - 1, 0);
    const updatedLabels = Labels.map((l) =>
        l.ID === labelID
            ? l
            : {
                  ...l,
                  ContextNumUnread: updatedContextNumUnread
              }
    );

    return {
        ...conversation,
        NumUnread: updatedNumUnread,
        ContextNumUnread: updatedContextNumUnread,
        Labels: updatedLabels
    };
};

export const useOptimisticMarkAs = () => {
    const getElementsCache = useGetElementsCache();
    const setElementsCache = useSetElementsCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();

    const optimisticMarkAs = useHandler((elements: Element[], labelID: string, changes: MarkAsChanges) => {
        const elementsCache = getElementsCache();
        const rollbackChanges = [] as { element: Element; changes: MarkAsChanges }[];
        const updatedElements = {} as { [elementID: string]: Element };

        elements.forEach((element) => {
            rollbackChanges.push({ element, changes: computeRollbackMarkAsChanges(element, labelID, changes) });

            if (isMessage(element)) {
                const message = element as Message;
                const localID = getLocalID(messageCache, message.ID);

                // Update in message cache
                const messageFromCache = messageCache.get(localID);

                if (messageFromCache && messageFromCache.data) {
                    messageCache.set(localID, {
                        ...messageFromCache,
                        data: applyMarkAsChangesOnMessage(messageFromCache.data, changes)
                    });
                }

                // Update in conversation cache
                const conversationResult = conversationCache.get(message.ConversationID);
                if (conversationResult) {
                    const conversation = conversationResult.Conversation;
                    conversationCache.set(message.ConversationID, {
                        Conversation: applySingleMarkAsChangesOnConversation(conversation, labelID, changes),
                        Messages: conversationResult.Messages?.map((conversationMessage) => {
                            if (conversationMessage.ID === message.ID) {
                                return applyMarkAsChangesOnMessage(conversationMessage, changes);
                            }
                            return conversationMessage;
                        })
                    });
                }

                // Updates in elements cache if message mode
                const messageElement = elementsCache.elements[message.ID] as Message | undefined;
                if (messageElement) {
                    updatedElements[messageElement.ID] = applyMarkAsChangesOnMessage(messageElement, changes);
                }

                // Update in elements cache if conversation mode
                const conversationElement = elementsCache.elements[message.ConversationID] as Conversation | undefined;
                if (conversationElement && conversationElement.ID) {
                    updatedElements[conversationElement.ID] = applySingleMarkAsChangesOnConversation(
                        conversationElement,
                        labelID,
                        changes
                    );
                }
            } else {
                // isConversation
                const conversation = element as RequireSome<Conversation, 'ID'>;

                // Update in conversation cache
                const conversationResult = conversationCache.get(conversation.ID);

                if (conversationResult) {
                    const conversationFromCache = conversationResult.Conversation;
                    conversationCache.set(conversation.ID, {
                        Conversation: applyMarkAsChangesOnWholeConversation(conversationFromCache, labelID, changes),
                        Messages: conversationResult.Messages
                    });
                }

                // Update in elements cache if conversation mode
                const conversationElement = elementsCache.elements[conversation.ID] as Conversation | undefined;
                if (conversationElement && conversationElement.ID) {
                    updatedElements[conversationElement.ID] = applyMarkAsChangesOnWholeConversation(
                        conversationElement,
                        labelID,
                        changes
                    );
                }

                // Update messages from the conversation (if loaded)
                if (changes.status === MARK_AS_STATUS.READ) {
                    const messages = conversationResult?.Messages;
                    messages?.forEach((message) => {
                        if (!message.LabelIDs.find((id) => id === labelID)) {
                            return;
                        }

                        const localID = getLocalID(messageCache, message.ID);

                        // Update in message cache
                        const messageFromCache = messageCache.get(localID);
                        if (messageFromCache && messageFromCache.data) {
                            messageCache.set(localID, {
                                ...messageFromCache,
                                data: applyMarkAsChangesOnMessage(messageFromCache.data, changes)
                            });
                        }
                    });
                }
            }
        });

        if (Object.keys(updatedElements).length) {
            setElementsCache({
                ...elementsCache,
                elements: { ...elementsCache.elements, ...updatedElements }
            });
        }

        return () => {
            rollbackChanges.forEach(({ element, changes }) => optimisticMarkAs([element], labelID, changes));
        };
    });

    return optimisticMarkAs;
};
