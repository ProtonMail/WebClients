import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/index';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import useFlag from '@proton/unleash/useFlag';

import { isConversation as testIsConversation, isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import { useMoveEngine } from 'proton-mail/helpers/location/MoveEngine/useMoveEngine';
import useMailModel from 'proton-mail/hooks/useMailModel';
import type { Element } from 'proton-mail/models/element';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { labelMessages, unlabelMessages } from 'proton-mail/store/mailbox/mailboxActions';

export interface ApplyLocationParams {
    elements: Element[];
    targetLabelID: string;
    removeLabel?: boolean;
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

    const applyLocation = ({
        elements,
        removeLabel = false,
        targetLabelID,
        showSuccessNotification = true,
    }: ApplyLocationParams): Promise<any> => {
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

            throw new Error('Not implemented');
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

            if (removeLabel) {
                return dispatch(
                    unlabelMessages({
                        elements: result.allowedElements as Message[],
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
                        elements: result.allowedElements as Message[],
                        targetLabelID,
                        isEncryptedSearch: false,
                        showSuccessNotification,
                        labels,
                        folders,
                    })
                );
            }
        } else {
            throw new Error('Not implemented');
        }
    };

    return { applyOptimisticLocationEnabled: flagState && mailSettings.ViewMode === VIEW_MODE.SINGLE, applyLocation };
};
