import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { useHandler, useFolders, useCache } from 'react-components';
import { MessageCountsModel, ConversationCountsModel } from 'proton-shared/lib/models';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import { STATUS } from 'proton-shared/lib/models/cache';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useGetElementsCache, useSetElementsCache } from '../mailbox/useElementsCache';
import { Conversation } from '../../models/conversation';
import { Element } from '../../models/element';
import { useConversationCache } from '../../containers/ConversationProvider';
import { isMessage as testIsMessage, getCurrentFolderID, hasLabel } from '../../helpers/elements';
import { updateCounters } from '../../helpers/counter';
import {
    LabelChanges,
    applyLabelChangesOnMessage,
    applyLabelChangesOnConversation,
    applyLabelChangesOnOneMessageOfAConversation,
} from '../../helpers/labels';
import { CacheEntry } from '../../models/tools';

const { SENT, DRAFTS } = MAILBOX_LABEL_IDS;

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
    const getElementsCache = useGetElementsCache();
    const setElementsCache = useSetElementsCache();
    const messageCache = useMessageCache();
    const conversationCache = useConversationCache();
    const [folders = []] = useFolders();
    const globalCache = useCache();

    /**
     * Apply optimistically changes in the cache
     * @param elements
     * @param inputChanges
     * @param isMove Is the label change is a move to folder
     * @param currentLabelID The current label ID on the UI, only used for moves, moving from sent or draft folders have speficic meaning
     * @returns a rollback function to undo all changes
     */
    const optimisticApplyLabels = useHandler(
        (elements: Element[], inputChanges: LabelChanges, isMove = false, currentLabelID?: string) => {
            const elementsCache = getElementsCache();
            const rollbackChanges = [] as { element: Element; changes: LabelChanges }[];
            const updatedElements = {} as { [elementID: string]: Element };
            const isMessage = testIsMessage(elements[0]);
            let { value: messageCounters } = globalCache.get(MessageCountsModel.key) as CacheEntry<LabelCount[]>;
            let { value: conversationCounters } = globalCache.get(ConversationCountsModel.key) as CacheEntry<
                LabelCount[]
            >;

            // Updates in message cache
            elements.forEach((element) => {
                const changes = { ...inputChanges };

                if (isMove) {
                    const currentFolderID = ([SENT, DRAFTS] as string[]).includes(currentLabelID || '')
                        ? (currentLabelID as string)
                        : getCurrentFolderID(element, folders);

                    if (changes[currentFolderID]) {
                        // It's a move to the folder where the elements is already, so nothing to do or undo
                        return;
                    }

                    changes[currentFolderID] = false;
                }

                rollbackChanges.push({ element, changes: computeRollbackLabelChanges(element, changes) });

                if (isMessage) {
                    const message = element as Message;
                    const localID = getLocalID(messageCache, message.ID);

                    // Update in message cache
                    const messageFromCache = messageCache.get(localID);
                    if (messageFromCache && messageFromCache.data) {
                        messageCache.set(localID, {
                            ...messageFromCache,
                            data: applyLabelChangesOnMessage(messageFromCache.data, changes),
                        });
                    }

                    // Update in conversation cache
                    const conversationResult = conversationCache.get(message.ConversationID);
                    if (conversationResult) {
                        const conversation = conversationResult.Conversation;
                        const {
                            updatedConversation,
                            conversationChanges,
                        } = applyLabelChangesOnOneMessageOfAConversation(conversation, changes);
                        conversationCache.set(message.ConversationID, {
                            Conversation: updatedConversation,
                            Messages: conversationResult.Messages?.map((messageFromConversation) => {
                                if (messageFromConversation.ID === message.ID) {
                                    return applyLabelChangesOnMessage(messageFromConversation, changes);
                                }
                                return messageFromConversation;
                            }),
                        });

                        // Update conversation count when the conversation is loaded
                        conversationCounters = updateCounters(conversation, conversationCounters, conversationChanges);
                    }

                    // Updates in elements cache if message mode
                    const messageElement = elementsCache.elements[message.ID] as Message | undefined;
                    if (messageElement) {
                        updatedElements[messageElement.ID] = applyLabelChangesOnMessage(messageElement, changes);
                    }

                    // Update in elements cache if conversation mode
                    const conversationElement = elementsCache.elements[message.ConversationID] as
                        | Conversation
                        | undefined;
                    if (conversationElement && conversationElement.ID) {
                        const { updatedConversation } = applyLabelChangesOnOneMessageOfAConversation(
                            conversationElement,
                            changes
                        );
                        updatedElements[conversationElement.ID] = updatedConversation;
                    }

                    // Update message and conversation counters
                    messageCounters = updateCounters(message, messageCounters, changes);
                } else {
                    // isConversation
                    const conversation = element as RequireSome<Conversation, 'ID'>;

                    // Update in conversation cache
                    const conversationResult = conversationCache.get(conversation.ID);
                    if (conversationResult) {
                        const conversationFromCache = conversationResult.Conversation;
                        conversationCache.set(conversation.ID, {
                            Conversation: applyLabelChangesOnConversation(conversationFromCache, changes),
                            Messages: conversationResult.Messages,
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
                                data: applyLabelChangesOnMessage(messageFromCache.data, changes),
                            });
                        }
                    });

                    // Update conversation counters
                    conversationCounters = updateCounters(conversation, conversationCounters, changes);
                }
            });

            if (Object.keys(updatedElements).length) {
                setElementsCache({
                    ...elementsCache,
                    elements: { ...elementsCache.elements, ...updatedElements },
                    bypassFilter: isMove
                        ? elementsCache.bypassFilter.filter((elementID) => !updatedElements[elementID])
                        : elementsCache.bypassFilter,
                });
            }

            globalCache.set(MessageCountsModel.key, { value: messageCounters, status: STATUS.RESOLVED });
            globalCache.set(ConversationCountsModel.key, { value: conversationCounters, status: STATUS.RESOLVED });

            return () => {
                rollbackChanges.forEach((rollbackChange) => {
                    optimisticApplyLabels([rollbackChange.element], rollbackChange.changes);
                });
            };
        }
    );

    return optimisticApplyLabels;
};
