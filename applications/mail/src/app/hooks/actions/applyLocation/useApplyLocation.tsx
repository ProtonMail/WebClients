import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/index';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { type SPAM_ACTION, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import useFlag from '@proton/unleash/useFlag';

import { useMailGlobalModals } from 'proton-mail/containers/globalModals/GlobalModalProvider';
import { ModalType } from 'proton-mail/containers/globalModals/inteface';
import { isConversation as testIsConversation, isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import { useMoveEngine } from 'proton-mail/helpers/location/MoveEngine/useMoveEngine';
import {
    shouldOpenConfirmationModalForConverversation,
    shouldOpenConfirmationModalForMessages,
} from 'proton-mail/helpers/location/moveModal/shouldOpenModal';
import { useGetConversation } from 'proton-mail/hooks/conversation/useConversation';
import useMailModel from 'proton-mail/hooks/useMailModel';
import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { labelMessages, unlabelMessages } from 'proton-mail/store/mailbox/mailboxActions';

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

    const getConversationById = useGetConversation();

    const dispatchMessage = ({
        elements,
        removeLabel = false,
        targetLabelID,
        showSuccessNotification = true,
    }: ApplyLocationParams): Promise<any> => {
        if (removeLabel) {
            return dispatch(
                unlabelMessages({
                    elements: elements as Message[],
                    targetLabelID,
                    isEncryptedSearch: false,
                    showSuccessNotification,
                    labels,
                    folders,
                })
            );
        } else {
            return dispatch(
                labelMessages({
                    elements: elements as Message[],
                    targetLabelID,
                    isEncryptedSearch: false,
                    showSuccessNotification,
                    labels,
                    folders,
                })
            );
        }
    };

    const dispatchConversation = (): Promise<any> => {
        throw new Error('Not implemented');
    };

    const applyLocation = ({
        elements,
        removeLabel = false,
        askUnsubscribe = true,
        targetLabelID,
        showSuccessNotification = true,
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
                            return dispatchConversation();
                        },
                    },
                });
                return Promise.resolve();
            } else if (shouldOpenModal === ModalType.Snooze) {
                notify({
                    type: ModalType.Snooze,
                    value: {
                        onConfirm: () => {
                            return dispatchConversation();
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
                            alert(`Unsubscribed ${spamAction}`);
                            return dispatchConversation();
                        },
                    },
                });
                return Promise.resolve();
            }

            return dispatchConversation();
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
                            // TODO handle in the conversation reducer merge request
                            console.log(`spamAction: ${spamAction}`);
                            return dispatchMessage({
                                elements: result.allowedElements as Message[],
                                targetLabelID,
                                removeLabel,
                                showSuccessNotification,
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
            });
        } else {
            throw new Error('Not implemented');
        }
    };

    return { applyOptimisticLocationEnabled: flagState && mailSettings.ViewMode === VIEW_MODE.SINGLE, applyLocation };
};
