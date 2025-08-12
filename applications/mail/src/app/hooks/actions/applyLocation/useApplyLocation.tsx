import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/index';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { type SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';
import { isConversation as testIsConversation, isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import { useMoveEngine } from 'proton-mail/helpers/location/MoveEngine/useMoveEngine';
import {
    shouldOpenConfirmationModalForConverversation,
    shouldOpenConfirmationModalForMessages,
} from 'proton-mail/helpers/location/moveModal/shouldOpenModal';
import { useCreateFilters } from 'proton-mail/hooks/actions/useCreateFilters';
import { useGetConversation } from 'proton-mail/hooks/conversation/useConversation';
import { useGetElementByID } from 'proton-mail/hooks/mailbox/useElements';
import useMailModel from 'proton-mail/hooks/useMailModel';
import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';
import { paramsSelector } from 'proton-mail/store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import {
    labelConversations,
    labelMessages,
    unlabelConversations,
    unlabelMessages,
} from 'proton-mail/store/mailbox/mailboxActions';

export interface ApplyLocationParams {
    elements: Element[];
    targetLabelID: string;
    removeLabel?: boolean;
    // This is used to avoid sending a unsubscribe request to a phishing email
    askUnsubscribe?: boolean;
    createFilters?: boolean;
    showSuccessNotification?: boolean;
}

export const useApplyLocation = () => {
    const mailSettings = useMailModel('MailSettings');
    const flagState = useFlag('ApplyLabelsOptimisticRefactoring');
    const dispatch = useMailDispatch();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    const { createNotification } = useNotifications();

    const { conversationMoveEngine, messageMoveEngine } = useMoveEngine();
    const { notify } = useMailGlobalModals();

    const sourceLabelID = useMailSelector(paramsSelector).labelID;

    const { getFilterActions } = useCreateFilters();

    const getConversationById = useGetConversation();
    const getElementByID = useGetElementByID();

    const dispatchMessage = ({
        elements,
        removeLabel = false,
        targetLabelID,
        showSuccessNotification = true,
        spamAction,
        createFilters,
    }: ApplyLocationParams & { spamAction?: SPAM_ACTION }): Promise<any> => {
        // Get all conversations in element state linked to messages that are moving
        const conversationIDs = unique((elements as Message[]).map((message) => message.ConversationID));
        const conversationsFromMessages: Conversation[] = conversationIDs
            .map((id: string) => {
                return getElementByID(id);
            })
            .filter(isTruthy);

        const { doCreateFilters, undoCreateFilters } = getFilterActions();
        if (createFilters) {
            void doCreateFilters(elements, [targetLabelID], false);
        }

        if (removeLabel) {
            return dispatch(
                unlabelMessages({
                    elements: elements as Message[],
                    conversations: conversationsFromMessages,
                    targetLabelID,
                    sourceLabelID,
                    isEncryptedSearch: false,
                    showSuccessNotification,
                    labels,
                    folders,
                    onActionUndo: () => {
                        if (createFilters) {
                            void undoCreateFilters();
                        }
                    },
                })
            );
        } else {
            return dispatch(
                labelMessages({
                    elements: elements as Message[],
                    conversations: conversationsFromMessages,
                    targetLabelID,
                    sourceLabelID,
                    isEncryptedSearch: false,
                    showSuccessNotification,
                    labels,
                    folders,
                    spamAction,
                    onActionUndo: () => {
                        if (createFilters) {
                            void undoCreateFilters();
                        }
                    },
                })
            );
        }
    };

    const dispatchConversation = ({
        elements,
        removeLabel = false,
        targetLabelID,
        showSuccessNotification = true,
        spamAction,
        createFilters,
    }: ApplyLocationParams & { spamAction?: SPAM_ACTION }): Promise<any> => {
        const { doCreateFilters, undoCreateFilters } = getFilterActions();
        if (createFilters) {
            void doCreateFilters(elements, [targetLabelID], true);
        }

        if (removeLabel) {
            return dispatch(
                unlabelConversations({
                    conversations: elements as Conversation[],
                    targetLabelID,
                    isEncryptedSearch: false,
                    showSuccessNotification,
                    labels,
                    folders,
                    onActionUndo: () => {
                        if (createFilters) {
                            void undoCreateFilters();
                        }
                    },
                })
            );
        } else {
            return dispatch(
                labelConversations({
                    conversations: elements as Conversation[],
                    targetLabelID,
                    sourceLabelID,
                    isEncryptedSearch: false,
                    showSuccessNotification,
                    labels,
                    folders,
                    spamAction,
                    onActionUndo: () => {
                        if (createFilters) {
                            void undoCreateFilters();
                        }
                    },
                })
            );
        }
    };

    const applyLocation = ({
        elements,
        removeLabel = false,
        askUnsubscribe = true,
        targetLabelID,
        showSuccessNotification = true,
        createFilters,
    }: ApplyLocationParams): Promise<any> => {
        if (!elements) {
            throw new Error('Elements are required');
        }

        const [firstElement] = elements;
        const isMessage = testIsMessage(firstElement);
        const isConversation = testIsConversation(firstElement);

        if (isConversation) {
            const result = conversationMoveEngine.validateMove(targetLabelID, elements as Message[], removeLabel);

            if (result.deniedElements.length > 0 && result.allowedElements.length === 0) {
                createNotification({
                    text: c('Error').t`This action cannot be performed`,
                    type: 'error',
                });

                return Promise.resolve();
            }

            // The actions would result in no change, so we can return
            if (result.notApplicableElements.length === elements.length || result.allowedElements.length === 0) {
                createNotification({
                    text: c('Info').t`No change will be made to the selected emails`,
                    type: 'info',
                });
                return Promise.resolve();
            }

            const shouldOpenModal = shouldOpenConfirmationModalForConverversation({
                elements: result.allowedElements as Conversation[],
                conversationsFromState: elements.map((conversation) => getConversationById(conversation.ID)),
                targetLabelID,
                mailSettings,
                folders,
            });

            if (shouldOpenModal === ModalType.Schedule) {
                notify({
                    type: ModalType.Schedule,
                    value: {
                        isMessage,
                        onConfirm: () => {
                            return dispatchConversation({
                                elements: result.allowedElements as Message[],
                                targetLabelID,
                                removeLabel,
                                showSuccessNotification,
                                createFilters,
                            });
                        },
                    },
                });

                return Promise.resolve();
            } else if (shouldOpenModal === ModalType.Snooze) {
                notify({
                    type: ModalType.Snooze,
                    value: {
                        onConfirm: () => {
                            return dispatchConversation({
                                elements: result.allowedElements as Message[],
                                targetLabelID,
                                removeLabel,
                                showSuccessNotification,
                                createFilters,
                            });
                        },
                    },
                });
                return Promise.resolve();
            } else if (shouldOpenModal === ModalType.Unsubscribe && askUnsubscribe) {
                notify({
                    type: ModalType.Unsubscribe,
                    value: {
                        isMessage,
                        elementLength: elements.length,
                        onConfirm: (spamAction: SPAM_ACTION) => {
                            return dispatchConversation({
                                elements: result.allowedElements as Message[],
                                targetLabelID,
                                removeLabel,
                                showSuccessNotification,
                                spamAction,
                                createFilters,
                            });
                        },
                    },
                });
                return Promise.resolve();
            }

            return dispatchConversation({
                elements: result.allowedElements as Message[],
                targetLabelID,
                removeLabel,
                showSuccessNotification,
                createFilters,
            });
        } else if (isMessage) {
            const result = messageMoveEngine.validateMove(targetLabelID, elements as Message[], removeLabel);

            if (result.deniedElements.length > 0 && result.allowedElements.length === 0) {
                createNotification({
                    text: c('Error').t`This action cannot be performed`,
                    type: 'error',
                });

                return Promise.resolve();
            }

            // The actions would result in no change, so we can return
            if (result.notApplicableElements.length === elements.length || result.allowedElements.length === 0) {
                createNotification({
                    text: c('Info').t`No change will be made to the selected emails`,
                    type: 'info',
                });
                return Promise.resolve();
            }

            const shouldOpenModal = shouldOpenConfirmationModalForMessages({
                elements: result.allowedElements as Message[],
                targetLabelID,
                mailSettings,
            });

            if (shouldOpenModal === ModalType.Schedule) {
                notify({
                    type: ModalType.Schedule,
                    value: {
                        isMessage,
                        onConfirm: () => {
                            return dispatchMessage({
                                elements: result.allowedElements as Message[],
                                targetLabelID,
                                removeLabel,
                                showSuccessNotification,
                                createFilters,
                            });
                        },
                    },
                });
                return Promise.resolve();
            } else if (shouldOpenModal === ModalType.Unsubscribe) {
                notify({
                    type: ModalType.Unsubscribe,
                    value: {
                        isMessage,
                        elementLength: elements.length,
                        onConfirm: (spamAction: SPAM_ACTION) => {
                            return dispatchMessage({
                                elements: result.allowedElements as Message[],
                                targetLabelID,
                                removeLabel,
                                showSuccessNotification,
                                spamAction,
                                createFilters,
                            });
                        },
                    },
                });
                return Promise.resolve();
            }

            return dispatchMessage({
                elements: result.allowedElements as Message[],
                targetLabelID,
                removeLabel,
                showSuccessNotification,
                createFilters,
            });
        } else {
            throw new Error('Not implemented');
        }
    };

    return { applyOptimisticLocationEnabled: flagState, applyLocation };
};
