import { useHandler } from '@proton/components';
import {
    conversationCountsActions,
    messageCountsActions,
    selectConversationCounts,
    selectMessageCounts,
    useFolders,
    useLabels,
} from '@proton/mail';
import { isCustomLabel } from '@proton/mail/labels/helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import type { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';

import { updateCounters } from '../../helpers/counter';
import { getCurrentFolderIDs, getLabelIDs, hasLabel, isMessage as testIsMessage } from '../../helpers/elements';
import type { LabelChanges, UnreadStatus } from '../../helpers/labels';
import {
    applyLabelChangesOnConversation,
    applyLabelChangesOnMessage,
    applyLabelChangesOnOneMessageOfAConversation,
} from '../../helpers/labels';
import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import {
    applyLabelsOnConversation,
    applyLabelsOnConversationMessages,
} from '../../store/conversations/conversationsActions';
import {
    optimisticApplyLabels as optimisticApplyLabelsElementsAction,
    optimisticMarkAs as optimisticMarkAsElementsAction,
} from '../../store/elements/elementsActions';
import {
    optimisticApplyLabels as optimisticApplyLabelsMessageAction,
    optimisticMarkAs as optimisticMarkAsMessageAction,
} from '../../store/messages/optimistic/messagesOptimisticActions';
import { useGetConversation } from '../conversation/useConversation';
import { useGetElementByID } from '../mailbox/useElements';

const { SENT, DRAFTS, ALL_DRAFTS, ALL_SENT, ALL_MAIL, ALMOST_ALL_MAIL } = MAILBOX_LABEL_IDS;

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

// Helper used to determine whether moving an element will remove it from the current label
export const getIsElementMovingOutFromLabel = ({
    currentLabelID,
    inputChanges,
    labels,
}: {
    currentLabelID?: string;
    inputChanges: LabelChanges | LabelChanges[];
    labels: Label[];
}) => {
    // Under the following conditions:
    // - Current label is not defined
    // - Current label is all drafts, all sent or all mail
    const shouldStayInLocation =
        !!currentLabelID && [ALL_DRAFTS, ALL_SENT, ALL_MAIL].includes(currentLabelID as MAILBOX_LABEL_IDS);
    // - Current label is a custom label and not moving the item to trash or spam
    const shouldStayInCustomLabel =
        !!currentLabelID &&
        isCustomLabel(currentLabelID, labels) &&
        !Object.keys(inputChanges).includes(MAILBOX_LABEL_IDS.TRASH) &&
        !Object.keys(inputChanges).includes(MAILBOX_LABEL_IDS.SPAM);
    // - Current label is almost all mail and moving the item to a location that is not TRASH or SPAN
    const shouldStayInAlmostAllMail =
        !!currentLabelID &&
        currentLabelID === ALMOST_ALL_MAIL &&
        !Object.keys(inputChanges).includes(MAILBOX_LABEL_IDS.TRASH) &&
        !Object.keys(inputChanges).includes(MAILBOX_LABEL_IDS.SPAM);

    // => A move should not change the total, since the element will stay in the current location
    // Else, the total needs to be updated because the item will move
    const shouldStayInCurrentLocation =
        !currentLabelID || shouldStayInLocation || shouldStayInCustomLabel || shouldStayInAlmostAllMail;

    return !shouldStayInCurrentLocation;
};

export const useOptimisticApplyLabels = () => {
    const store = useMailStore();
    const dispatch = useMailDispatch();
    const getElementByID = useGetElementByID();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();
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
        ({
            elements,
            inputChanges,
            isMove = false,
            unreadStatuses,
            currentLabelID,
            isRollback,
            inputElementTotalAdjustment,
            isUnstarringElement = false,
        }: {
            elements: Element[];
            inputChanges: LabelChanges | LabelChanges[];
            isMove?: boolean;
            unreadStatuses?: UnreadStatus[];
            currentLabelID?: string;
            isRollback?: boolean;
            inputElementTotalAdjustment?: number;
            isUnstarringElement?: boolean;
        }) => {
            const rollbackChanges = [] as { element: Element; changes: LabelChanges }[];
            const updatedElements = [] as Element[];
            const elementsUnreadStatuses = [] as UnreadStatus[];
            const isMessage = testIsMessage(elements[0]);
            let { value: messageCounters = [] } = selectMessageCounts(store.getState());
            let { value: conversationCounters = [] } = selectConversationCounts(store.getState());

            // We need to update the element total optimistically as well.
            // If the action is a rollback, use the input value,
            // else we need to check for each element whether it needs to be removed from the total.
            let elementTotalAdjustment = inputElementTotalAdjustment || 0;

            // Updates in message cache
            elements.forEach((element, index) => {
                const changes = Array.isArray(inputChanges) ? { ...inputChanges[index] } : { ...inputChanges };

                // No need to trigger this action during rollback since we already know where to put the element back
                if ((isMove || isUnstarringElement) && !isRollback) {
                    const currentFolderIDs = ([SENT, DRAFTS] as string[]).includes(currentLabelID || '')
                        ? [currentLabelID as string]
                        : getCurrentFolderIDs(element, folders);

                    const isMoveToCurrentFolder = currentFolderIDs.every((folderID) => changes[folderID]);

                    if (isMoveToCurrentFolder) {
                        // It's a move to the folder where the elements already are, so nothing to do or undo
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

                            /*
                             * Mark message element as read when moving to trash
                             *
                             * To have a real clean state when moving a message to trash, we should update:
                             * 1- The message element in the Elements state
                             * 2- The conversation associated conversation element in the Element state (if it exists)
                             * 3- The message in the Message state
                             * 4- The conversation in the Conversation state (if it exists)
                             *
                             * This is not a trivial task, and since we want a quick fix so that elements from the list are
                             * marked as read when moving a message to trash, we will only update the Elements state for now.
                             * Updating the message state is also easy, so in that case we can do it.
                             *
                             * We think that the code from optimistic hooks is too old,
                             * so if we want to get a perfect state using robust optimistic, we should rework them completely.
                             */
                            const updatedElement = {
                                ...message,
                                Unread: 0,
                            };

                            dispatch(
                                optimisticMarkAsMessageAction({
                                    ID: message.ID,
                                    changes: { status: MARK_AS_STATUS.READ },
                                })
                            );

                            dispatch(
                                optimisticMarkAsElementsAction({
                                    isMove,
                                    elements: [updatedElement],
                                    markAsStatus: MARK_AS_STATUS.READ,
                                    elementTotalAdjustment: inputElementTotalAdjustment,
                                })
                            );
                        } else {
                            const conversation = element as Conversation;
                            elementsUnreadStatuses.push({
                                id: conversation.ID ? conversation.ID : '',
                                unread: conversation.NumUnread ? conversation.NumUnread : 0,
                            });

                            /*
                             * Mark conversation element as read when moving to trash
                             *
                             * To have a real clean state when moving a conversation to trash, we should update:
                             * 1- The conversation element in the Elements state
                             * 2- Messages associated to the conversation element in the Element state (if they exist)
                             * 3- The conversation in the Conversation state
                             * 4- Messages associated to the conversation in the Message state (if they exist)
                             *
                             * This is not a trivial task, and since we want a quick fix so that elements from the list are
                             * marked as read when moving a conversation to trash, we will only update the Elements state for now.
                             *
                             * We think that the code from optimistic hooks is too old,
                             * so if we want to get a perfect state using robust optimistic, we should rework them completely.
                             */
                            const updatedElement = {
                                ...element,
                                NumUnread: 0,
                                ContextNumUnread: 0,
                            };

                            (updatedElement as Conversation).Labels?.forEach((label) => {
                                return { ...label, ContextNumUnread: 0 };
                            });

                            dispatch(
                                optimisticMarkAsElementsAction({
                                    isMove,
                                    elements: [updatedElement],
                                    markAsStatus: MARK_AS_STATUS.READ,
                                    elementTotalAdjustment: inputElementTotalAdjustment,
                                })
                            );
                        }
                    }

                    // When an item is un-starred, we want to update the counters,
                    // so we need to pass in the parent "if" condition
                    // However, in case of a "true" move action, we need to move the item from other location,
                    // Which we shouldn't do when un-starring an item
                    // e.g. a starred element in inbox should be moved out from starred but not from inbox when un-starring it
                    if (!isUnstarringElement) {
                        currentFolderIDs.forEach((folderID) => {
                            changes[folderID] = false;
                        });
                    }

                    // If moving an element to spam or trash, we can remove it from almost all mail and custom labels too
                    if (
                        Object.keys(inputChanges).includes(MAILBOX_LABEL_IDS.TRASH) ||
                        Object.keys(inputChanges).includes(MAILBOX_LABEL_IDS.SPAM)
                    ) {
                        changes[MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL] = false;

                        // Remove from starred when moving to trash or spam
                        if (hasLabel(element, MAILBOX_LABEL_IDS.STARRED)) {
                            changes[MAILBOX_LABEL_IDS.STARRED] = false;
                        }

                        // Remove the item from all custom label ids
                        const elementLabels = getLabelIDs(element, currentLabelID);
                        Object.keys(elementLabels).forEach((label) => {
                            if (isCustomLabel(label, labels)) {
                                changes[label] = false;
                            }
                        });
                    }

                    // Check if the action will remove the element from the current location.
                    // If so, we can increase the amount that needs to be removed on the elements total.
                    const isMovingOutFromLabel = getIsElementMovingOutFromLabel({
                        currentLabelID,
                        inputChanges,
                        labels,
                    });
                    elementTotalAdjustment = isMovingOutFromLabel ? elementTotalAdjustment - 1 : elementTotalAdjustment;
                }

                rollbackChanges.push({ element, changes: computeRollbackLabelChanges(element, changes) });

                if (isMessage) {
                    const message = element as Message;

                    dispatch(optimisticApplyLabelsMessageAction({ ID: element.ID || '', changes, unreadStatuses }));

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
                    conversationFromState?.Messages?.forEach((message) => {
                        dispatch(optimisticApplyLabelsMessageAction({ ID: message.ID, changes, unreadStatuses }));
                    });

                    // Update conversation counters
                    conversationCounters = updateCounters(conversation, conversationCounters, changes);
                }
            });

            if (updatedElements.length) {
                dispatch(
                    optimisticApplyLabelsElementsAction({
                        elements: updatedElements,
                        isMove: isMove || isUnstarringElement,
                        elementTotalAdjustment,
                    })
                );
            }

            store.dispatch(messageCountsActions.set(messageCounters));
            store.dispatch(conversationCountsActions.set(conversationCounters));

            return () => {
                // Building elements and changes so that we do the optimistic update in a single call
                const { elements, inputChanges } = rollbackChanges.reduce<{
                    elements: Element[];
                    inputChanges: LabelChanges[];
                }>(
                    (acc, rollbackChange) => {
                        acc.elements.push(rollbackChange.element);
                        acc.inputChanges.push(rollbackChange.changes);
                        return acc;
                    },
                    { elements: [], inputChanges: [] }
                );

                optimisticApplyLabels({
                    elements,
                    inputChanges,
                    isMove,
                    unreadStatuses: elementsUnreadStatuses,
                    currentLabelID,
                    isRollback: true,
                    // When doing a rollback, we are not computing the updated total.
                    // We can add back to the total what we just removed
                    inputElementTotalAdjustment: elementTotalAdjustment * -1,
                    isUnstarringElement,
                });
            };
        }
    );

    return optimisticApplyLabels;
};
