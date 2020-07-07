import { useHandler, useFolders, useCache } from 'react-components';
import { MessageCountsModel } from 'proton-shared/lib/models';

import { useMessageCache, getLocalID } from '../containers/MessageProvider';
import { useElementsCache } from './useElementsCache';
import { Conversation, ConversationLabel } from '../models/conversation';
import { Element } from '../models/element';
import { Message, MessageExtended } from '../models/message';
import { RequireSome } from '../models/utils';
import { useConversationCache } from '../containers/ConversationProvider';
import { isMessage, getCurrentFolderID, hasLabel } from '../helpers/elements';
import { ConversationResult } from './useConversation';
import { PAGE_SIZE } from '../constants';

type LabelChanges = { [labelID: string]: boolean };

const applyChangesOnLabelIDs = (labelIDs: string[], changes: LabelChanges) => {
    const result = [...labelIDs];
    Object.keys(changes).forEach((labelID) => {
        const index = result.findIndex((existingLabelID) => existingLabelID === labelID);
        if (changes[labelID]) {
            if (index === -1) {
                result.push(labelID);
            }
        } else {
            if (index >= 0) {
                result.splice(index, 1);
            }
        }
    });
    return result;
};

const applyChangesOnConversationLabels = (labels: ConversationLabel[] = [], changes: LabelChanges) => {
    const result = [...labels];
    Object.keys(changes).forEach((labelID) => {
        const index = result.findIndex((existingLabel) => existingLabel.ID === labelID);
        if (changes[labelID]) {
            if (index === -1) {
                result.push({ ID: labelID });
            }
        } else {
            if (index >= 0) {
                result.splice(index, 1);
            }
        }
    });
    return result;
};

const applyChangesOnMessage = (message: Message, changes: LabelChanges): Message => {
    const LabelIDs = applyChangesOnLabelIDs(message.LabelIDs, changes);
    return { ...message, LabelIDs };
};

const applyChangesOnConversation = (conversation: Conversation, changes: LabelChanges): Conversation => {
    const LabelIDs = conversation.LabelIDs ? applyChangesOnLabelIDs(conversation.LabelIDs, changes) : undefined;
    const Labels = applyChangesOnConversationLabels(conversation.Labels, changes);
    return { ...conversation, LabelIDs, Labels };
};

const computeRollbackChanges = (element: Element, changes: LabelChanges) => {
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

const replaceCounter = (counters: any[], counter: any) =>
    counters.map((existingCounter: any) => {
        if (existingCounter.LabelID === counter.labelID) {
            return counter;
        } else {
            return existingCounter;
        }
    });

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
            const changes = inputChanges;

            if (isMove) {
                changes[getCurrentFolderID(element, folders)] = false;
            }

            rollbackChanges.push({ element, changes: computeRollbackChanges(element, changes) });

            if (isMessage(element)) {
                const message = element as Message;
                const localID = getLocalID(messageCache, message.ID);

                // Update in message cache
                const messageFromCache = messageCache.get(localID);
                if (messageFromCache && messageFromCache.data) {
                    messageCache.set(localID, {
                        ...messageFromCache,
                        data: applyChangesOnMessage(messageFromCache.data, changes)
                    });
                }

                // Update in conversation cache
                const conversationResult = conversationCache.get(message.ConversationID);
                if (conversationResult && conversationResult.Conversation.NumMessages === 1) {
                    const conversation = conversationResult.Conversation;
                    conversationCache.set(message.ConversationID, {
                        Conversation: applyChangesOnConversation(conversation, changes),
                        Messages: conversationResult.Messages
                    });
                }

                // Updates in elements cache if message mode
                const messageElement = elementsCache.elements[message.ID] as Message | undefined;
                if (messageElement) {
                    updatedElements[messageElement.ID] = applyChangesOnMessage(messageElement, changes);
                }

                // Update in elements cache if conversation mode
                const conversationElement = elementsCache.elements[message.ConversationID] as Conversation | undefined;
                if (conversationElement && conversationElement.ID && conversationElement.NumMessages === 1) {
                    updatedElements[conversationElement.ID] = applyChangesOnConversation(conversationElement, changes);
                }
            } else {
                // isConversation
                const conversation = element as RequireSome<Conversation, 'ID'>;

                // Update in conversation cache
                const conversationResult = conversationCache.get(conversation.ID);
                if (conversationResult) {
                    const conversationFromCache = conversationResult.Conversation;
                    conversationCache.set(conversation.ID, {
                        Conversation: applyChangesOnConversation(conversationFromCache, changes),
                        Messages: conversationResult.Messages
                    });
                }

                // Update in elements cache if conversation mode
                const conversationElement = elementsCache.elements[conversation.ID] as Conversation | undefined;
                if (conversationElement && conversationElement.ID) {
                    updatedElements[conversationElement.ID] = applyChangesOnConversation(conversationElement, changes);
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
                            data: applyChangesOnMessage(messageFromCache.data, changes)
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

export const useOptimisticEmptyLabel = () => {
    const globalCache = useCache();
    const [elementsCache, setElementsCache] = useElementsCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();

    return useHandler((labelID: string) => {
        const rollbackMessages = [] as MessageExtended[];
        const rollbackConversations = [] as ConversationResult[];

        // Message cache
        const messageIDs = [...messageCache.keys()];
        messageIDs.forEach((messageID) => {
            const message = messageCache.get(messageID) as MessageExtended;
            if (hasLabel(message.data || {}, labelID)) {
                messageCache.delete(messageID);
                rollbackMessages.push(message);
            }
        });

        // Conversation cache
        const conversationIDs = [...conversationCache.keys()];
        conversationIDs.forEach((conversationID) => {
            const conversation = conversationCache.get(conversationID) as ConversationResult;
            if (hasLabel(conversation.Conversation, labelID)) {
                conversationCache.delete(conversationID);
                rollbackConversations.push(conversation);
            } else {
                const messages = conversation.Messages?.filter((Message) => !hasLabel(Message, labelID));
                if (messages?.length !== conversation.Messages?.length) {
                    conversationCache.set(conversationID, {
                        Conversation: conversation.Conversation,
                        Messages: messages
                    });
                    rollbackConversations.push(conversation);
                }
            }
        });

        // Elements cache
        const rollbackElements = elementsCache;
        setElementsCache({
            ...elementsCache,
            elements: {},
            page: {
                limit: PAGE_SIZE,
                page: 0,
                size: PAGE_SIZE,
                total: 0
            }
        });

        // Counter
        const counters = globalCache.get(MessageCountsModel.key);
        const rollbackCounter = counters.value.find((counter: any) => counter.LabelID === labelID);
        globalCache.set(MessageCountsModel.key, {
            ...counters,
            value: replaceCounter(counters.value, { LabelID: labelID, Total: 0, Unread: 0 })
        });

        return () => {
            rollbackMessages.forEach((message) => {
                messageCache.set(message.localID, message);
            });
            rollbackConversations.forEach((conversation) => {
                conversationCache.set(conversation.Conversation.ID || '', conversation);
            });
            setElementsCache(rollbackElements);
            if (rollbackCounter) {
                globalCache.set(MessageCountsModel.key, {
                    ...counters,
                    value: replaceCounter(counters.value, rollbackCounter)
                });
            }
        };
    });
};
