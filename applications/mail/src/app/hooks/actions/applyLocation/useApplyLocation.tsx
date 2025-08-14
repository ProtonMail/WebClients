import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { isCustomFolder, isSystemFolder } from '@proton/mail/helpers/location';
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
import { useMoveBackAction } from 'proton-mail/hooks/actions/moveBackAction/useMoveBackAction';
import { useCreateFilters } from 'proton-mail/hooks/actions/useCreateFilters';
import { useGetConversation } from 'proton-mail/hooks/conversation/useConversation';
import { useGetElementByID } from 'proton-mail/hooks/mailbox/useElements';
import useMailModel from 'proton-mail/hooks/useMailModel';
import type { Conversation } from 'proton-mail/models/conversation';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import {
    labelConversations,
    labelMessages,
    unlabelConversations,
    unlabelMessages,
} from 'proton-mail/store/mailbox/mailboxActions';

import { MOVE_BACK_ACTION_TYPES } from '../moveBackAction/interfaces';
import {
    APPLY_LOCATION_TYPES,
    type ApplyLocationLabelProps,
    type ApplyLocationMoveProps,
    type ApplyLocationParams,
    type ApplyLocationStarProps,
} from './interface';

export const useApplyLocation = () => {
    const mailSettings = useMailModel('MailSettings');
    const flagState = useFlag('ApplyLabelsOptimisticRefactoring');
    const dispatch = useMailDispatch();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    const { createNotification } = useNotifications();
    const handleOnBackMoveAction = useMoveBackAction();

    const { conversationMoveEngine, messageMoveEngine } = useMoveEngine();
    const { notify } = useMailGlobalModals();

    const sourceLabelID = useMailSelector((state) => state.elements.params).labelID;

    const { getFilterActions } = useCreateFilters();

    const getConversationById = useGetConversation();
    const getElementByID = useGetElementByID();

    const dispatchMessage = ({
        elements,
        removeLabel = false,
        destinationLabelID,
        showSuccessNotification = true,
        spamAction,
        createFilters,
    }: ApplyLocationParams): Promise<any> => {
        // Get all conversations in element state linked to messages that are moving
        const conversationIDs = unique((elements as Message[]).map((message) => message.ConversationID));
        const conversationsFromMessages: Conversation[] = conversationIDs
            .map((id: string) => {
                return getElementByID(id);
            })
            .filter(isTruthy);

        const { doCreateFilters, undoCreateFilters } = getFilterActions();
        if (createFilters) {
            const isFolder = isCustomFolder(destinationLabelID, folders || []) || isSystemFolder(destinationLabelID);
            void doCreateFilters(elements, [destinationLabelID], isFolder);
        }

        if (removeLabel) {
            return dispatch(
                unlabelMessages({
                    elements: elements as Message[],
                    conversations: conversationsFromMessages,
                    destinationLabelID,
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
                    destinationLabelID,
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
        destinationLabelID,
        showSuccessNotification = true,
        spamAction,
        createFilters,
    }: ApplyLocationParams): Promise<any> => {
        const { doCreateFilters, undoCreateFilters } = getFilterActions();
        if (createFilters) {
            const isFolder = isCustomFolder(destinationLabelID, folders || []) || isSystemFolder(destinationLabelID);
            void doCreateFilters(elements, [destinationLabelID], isFolder);
        }

        if (removeLabel) {
            return dispatch(
                unlabelConversations({
                    conversations: elements as Conversation[],
                    destinationLabelID,
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
                    destinationLabelID,
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

    const moveToFolder = ({
        elements,
        removeLabel = false,
        askUnsubscribe = true,
        destinationLabelID,
        showSuccessNotification = true,
        createFilters,
    }: ApplyLocationMoveProps | ApplyLocationStarProps | ApplyLocationLabelProps): Promise<any> => {
        if (!elements) {
            throw new Error('Elements are required');
        }

        const [firstElement] = elements;
        const isMessage = testIsMessage(firstElement);
        const isConversation = testIsConversation(firstElement);

        if (isConversation) {
            const result = conversationMoveEngine.validateMove(destinationLabelID, elements as Message[], removeLabel);

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
                destinationLabelID,
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
                                destinationLabelID,
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
                                destinationLabelID,
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
                                destinationLabelID,
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
                destinationLabelID,
                removeLabel,
                showSuccessNotification,
                createFilters,
            });
        } else if (isMessage) {
            const result = messageMoveEngine.validateMove(destinationLabelID, elements as Message[], removeLabel);

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
                destinationLabelID,
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
                                destinationLabelID,
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
                                destinationLabelID,
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
                destinationLabelID,
                removeLabel,
                showSuccessNotification,
                createFilters,
            });
        } else {
            throw new Error('Not implemented');
        }
    };

    const applyLocation = (params: ApplyLocationMoveProps | ApplyLocationLabelProps | ApplyLocationStarProps) => {
        switch (params.type) {
            case APPLY_LOCATION_TYPES.MOVE:
                handleOnBackMoveAction({
                    type: MOVE_BACK_ACTION_TYPES.MOVE,
                    elements: params.elements,
                    destinationLabelID: params.destinationLabelID,
                });

                return moveToFolder({
                    ...params,
                    removeLabel: false,
                });
            case APPLY_LOCATION_TYPES.APPLY_LABEL:
                handleOnBackMoveAction({
                    type: MOVE_BACK_ACTION_TYPES.APPLY_LABEL,
                    changes: params.changes,
                    elements: params.elements,
                });

                return moveToFolder({
                    ...params,
                });

                break;
            case APPLY_LOCATION_TYPES.STAR:
                handleOnBackMoveAction({
                    type: MOVE_BACK_ACTION_TYPES.STAR,
                    elements: params.elements,
                    removeLabel: params.removeLabel || false,
                });

                return moveToFolder({
                    ...params,
                });
        }
    };

    return { applyOptimisticLocationEnabled: flagState, applyLocation };
};
