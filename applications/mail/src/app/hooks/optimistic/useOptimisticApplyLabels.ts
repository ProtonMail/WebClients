import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { useHandler, useFolders } from 'react-components';

import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useElementsCache } from '../useElementsCache';
import { Conversation } from '../../models/conversation';
import { Element } from '../../models/element';
import { Message } from '../../models/message';
import { useConversationCache } from '../../containers/ConversationProvider';
import { isMessage, getCurrentFolderID, hasLabel } from '../../helpers/elements';
import { LabelChanges, applyLabelChangesOnMessage, applyLabelChangesOnConversation } from '../../helpers/labels';

const computeRollbackLabelChanges = (element: Element, changes: LabelChanges) => {
    const rollbackChange = {} as LabelChanges;

    Object.keys(changes).forEach((labelID) => {
        if (changes[labelID] && !hasLabel(element, labelID)) {
            rollbackChange[labelID] = false;
        }
        if (!changes[labelID] && hasLabel(element, labelID)) {
            rollbackChange[labelID] = true;
        }
    });

    return rollbackChange;
};

export const useOptimisticApplyLabels = () => {
    const [elementsCache, setElementsCache] = useElementsCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();
    const [folders = []] = useFolders();

    const optimisticApplyLabels = useHandler((elements: Element[], inputChanges: LabelChanges, isMove = false) => {
        const rollbackChanges = [] as { element: Element; changes: LabelChanges }[];
        const updatedElements = {} as { [elementID: string]: Element };

        // Updates in message cache
        elements.forEach((element) => {
            const changes = { ...inputChanges };

            if (isMove) {
                const currentFolderID = getCurrentFolderID(element, folders);

                if (changes[currentFolderID]) {
                    // It's a move to the folder where the elements is already, so nothing to do or undo
                    return;
                }

                changes[currentFolderID] = false;
            }

            rollbackChanges.push({ element, changes: computeRollbackLabelChanges(element, changes) });

            if (isMessage(element)) {
                const message = element as Message;
                const localID = getLocalID(messageCache, message.ID);

                // Update in message cache
                const messageFromCache = messageCache.get(localID);
                if (messageFromCache && messageFromCache.data) {
                    messageCache.set(localID, {
                        ...messageFromCache,
                        data: applyLabelChangesOnMessage(messageFromCache.data, changes)
                    });
                }

                // Update in conversation cache
                const conversationResult = conversationCache.get(message.ConversationID);
                if (conversationResult && conversationResult.Conversation.NumMessages === 1) {
                    const conversation = conversationResult.Conversation;
                    conversationCache.set(message.ConversationID, {
                        Conversation: applyLabelChangesOnConversation(conversation, changes),
                        Messages: conversationResult.Messages
                    });
                }

                // Updates in elements cache if message mode
                const messageElement = elementsCache.elements[message.ID] as Message | undefined;
                if (messageElement) {
                    updatedElements[messageElement.ID] = applyLabelChangesOnMessage(messageElement, changes);
                }

                // Update in elements cache if conversation mode
                const conversationElement = elementsCache.elements[message.ConversationID] as Conversation | undefined;
                if (conversationElement && conversationElement.ID && conversationElement.NumMessages === 1) {
                    updatedElements[conversationElement.ID] = applyLabelChangesOnConversation(
                        conversationElement,
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
                        Conversation: applyLabelChangesOnConversation(conversationFromCache, changes),
                        Messages: conversationResult.Messages
                    });
                }

                // Update in elements cache if conversation mode
                const conversationElement = elementsCache.elements[conversation.ID] as Conversation | undefined;
                if (conversationElement && conversationElement.ID) {
                    updatedElements[conversationElement.ID] = applyLabelChangesOnConversation(
                        conversationElement,
                        changes
                    );
                }

                // Update messages from the conversation (if loaded)
                const messages = conversationResult?.Messages;
                messages?.forEach((message) => {
                    const localID = getLocalID(messageCache, message.ID);

                    // Update in message cache
                    const messageFromCache = messageCache.get(localID);
                    if (messageFromCache && messageFromCache.data) {
                        messageCache.set(localID, {
                            ...messageFromCache,
                            data: applyLabelChangesOnMessage(messageFromCache.data, changes)
                        });
                    }
                });
            }
        });

        if (Object.keys(updatedElements).length) {
            setElementsCache({
                ...elementsCache,
                elements: { ...elementsCache.elements, ...updatedElements }
            });
        }

        return () => {
            rollbackChanges.forEach((rollbackChange) => {
                optimisticApplyLabels([rollbackChange.element], rollbackChange.changes);
            });
        };
    });

    return optimisticApplyLabels;
};
