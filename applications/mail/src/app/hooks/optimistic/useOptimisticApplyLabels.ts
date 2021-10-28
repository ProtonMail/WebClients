import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { useHandler, useFolders, useCache } from '@proton/components';
import { MessageCountsModel, ConversationCountsModel } from '@proton/shared/lib/models';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import { STATUS } from '@proton/shared/lib/models/cache';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useDispatch } from 'react-redux';
import { useMessageCache, getLocalID } from '../../containers/MessageProvider';
import { useGetElementByID } from '../mailbox/useElements';
import { Conversation } from '../../models/conversation';
import { Element } from '../../models/element';
import { isMessage as testIsMessage, hasLabel, getCurrentFolderIDs } from '../../helpers/elements';
import { updateCounters } from '../../helpers/counter';
import {
    LabelChanges,
    applyLabelChangesOnMessage,
    applyLabelChangesOnConversation,
    applyLabelChangesOnOneMessageOfAConversation,
    UnreadStatus,
} from '../../helpers/labels';
import { CacheEntry } from '../../models/tools';
import { optimisticApplyLabels as optimisticApplyLabelsAction } from '../../logic/elements/elementsActions';
import {
    applyLabelsOnConversation,
    applyLabelsOnConversationMessages,
} from '../../logic/conversations/conversationsActions';
import { useGetConversation } from '../conversation/useConversation';

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
    const dispatch = useDispatch();
    const getElementByID = useGetElementByID();
    const messageCache = useMessageCache();
    const [folders = []] = useFolders();
    const globalCache = useCache();
    const getConversation = useGetConversation();

    /**
     * Apply optimistically changes in the cache
     * @param elements
     * @param inputChanges
     * @param isMove Is the label change is a move to folder
     * @param unreadStatuses unread statuses of all elements to be able to use them when using optimistic rollback. Is [] by default when moving, but can be filled when rollback
     * @param currentLabelID The current label ID on the UI, only used for moves, moving from sent or draft folders have specific meaning
     * @returns a rollback function to undo all changes
     */
    const optimisticApplyLabels = useHandler(
        (
            elements: Element[],
            inputChanges: LabelChanges,
            isMove = false,
            unreadStatuses?: UnreadStatus[],
            currentLabelID?: string
        ) => {
            const rollbackChanges = [] as { element: Element; changes: LabelChanges }[];
            const updatedElements = [] as Element[];
            const elementsUnreadStatuses = [] as UnreadStatus[];
            const isMessage = testIsMessage(elements[0]);
            let { value: messageCounters } = globalCache.get(MessageCountsModel.key) as CacheEntry<LabelCount[]>;
            let { value: conversationCounters } = globalCache.get(ConversationCountsModel.key) as CacheEntry<
                LabelCount[]
            >;

            // Updates in message cache
            elements.forEach((element) => {
                const changes = { ...inputChanges };

                if (isMove) {
                    const currentFolderIDs = ([SENT, DRAFTS] as string[]).includes(currentLabelID || '')
                        ? [currentLabelID as string]
                        : getCurrentFolderIDs(element, folders);

                    const isMoveToCurrentFolder = currentFolderIDs.every((folderID) => changes[folderID]);

                    if (isMoveToCurrentFolder) {
                        // It's a move to the folder where the elements is already, so nothing to do or undo
                        return;
                    }

                    /*
                     * When moving elements to trash, we store the unread status of all elements so that
                     * we can use the previous unread status for the optimistic rollback
                     */
                    if (Object.keys(inputChanges).includes(MAILBOX_LABEL_IDS.TRASH)) {
                        if (isMessage) {
                            const message = element as Message;
                            elementsUnreadStatuses.push({ id: message.ID, unread: message.Unread });
                        } else {
                            const conversation = element as Conversation;
                            elementsUnreadStatuses.push({
                                id: conversation.ID ? conversation.ID : '',
                                unread: conversation.NumUnread ? conversation.NumUnread : 0,
                            });
                        }
                    }

                    currentFolderIDs.forEach((folderID) => {
                        changes[folderID] = false;
                    });
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
                            data: applyLabelChangesOnMessage(messageFromCache.data, changes, unreadStatuses),
                        });
                    }

                    // Update in conversation cache
                    const conversationResult = getConversation(message.ConversationID);
                    if (conversationResult && conversationResult.Conversation) {
                        const conversation = conversationResult.Conversation;
                        const { updatedConversation, conversationChanges } =
                            applyLabelChangesOnOneMessageOfAConversation(conversation, changes);
                        dispatch(
                            applyLabelsOnConversationMessages({
                                ID: message.ConversationID,
                                messageID: message.ID,
                                changes,
                                unreadStatuses,
                                updatedConversation,
                                conversationResult, // TODO: Check if needed
                            })
                        );
                        // Update conversation count when the conversation is loaded
                        conversationCounters = updateCounters(conversation, conversationCounters, conversationChanges);
                    }

                    // Updates in elements cache if message mode
                    const messageElement = getElementByID(message.ID);
                    if (messageElement && messageElement.ID) {
                        updatedElements.push(
                            applyLabelChangesOnMessage(messageElement as Message, changes, unreadStatuses)
                        );
                    }

                    // Update in elements cache if conversation mode
                    const conversationElement = getElementByID(message.ConversationID);
                    if (conversationElement && conversationElement.ID) {
                        const { updatedConversation } = applyLabelChangesOnOneMessageOfAConversation(
                            conversationElement,
                            changes
                        );
                        updatedElements.push(updatedConversation);
                    }

                    // Update message and conversation counters
                    messageCounters = updateCounters(message, messageCounters, changes);
                } else {
                    // isConversation
                    const conversation = element as RequireSome<Conversation, 'ID'>;

                    // Update in conversation cache
                    const conversationFromState = getConversation(conversation.ID);
                    dispatch(applyLabelsOnConversation({ ID: conversation.ID, changes, unreadStatuses }));

                    // Update in elements cache if conversation mode
                    const conversationElement = getElementByID(conversation.ID);
                    if (conversationElement && conversationElement.ID) {
                        updatedElements.push(
                            applyLabelChangesOnConversation(conversationElement, changes, unreadStatuses)
                        );
                    }

                    // Update messages from the conversation (if loaded)
                    const messages = conversationFromState?.Messages;
                    messages?.forEach((message) => {
                        const localID = getLocalID(messageCache, message.ID);

                        // Update in message cache
                        const messageFromCache = messageCache.get(localID);
                        if (messageFromCache && messageFromCache.data) {
                            messageCache.set(localID, {
                                ...messageFromCache,
                                data: applyLabelChangesOnMessage(messageFromCache.data, changes, unreadStatuses),
                            });
                        }
                    });

                    // Update conversation counters
                    conversationCounters = updateCounters(conversation, conversationCounters, changes);
                }
            });

            if (updatedElements.length) {
                dispatch(optimisticApplyLabelsAction({ elements: updatedElements, isMove }));
            }

            globalCache.set(MessageCountsModel.key, { value: messageCounters, status: STATUS.RESOLVED });
            globalCache.set(ConversationCountsModel.key, { value: conversationCounters, status: STATUS.RESOLVED });

            return () => {
                rollbackChanges.forEach((rollbackChange) => {
                    optimisticApplyLabels(
                        [rollbackChange.element],
                        rollbackChange.changes,
                        false,
                        elementsUnreadStatuses
                    );
                });
            };
        }
    );

    return optimisticApplyLabels;
};
