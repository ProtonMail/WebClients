import { useNotifications } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/index';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import useFlag from '@proton/unleash/useFlag';

import { isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import { useMessageMoveEngine } from 'proton-mail/helpers/location/MoveEngine/useMessageMoveEngine';
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

    const moveEngine = useMessageMoveEngine();

    const applyLocation = ({
        elements,
        removeLabel = false,
        targetLabelID,
        showSuccessNotification = true,
    }: ApplyLocationParams): Promise<any> => {
        const [firstElement] = elements;
        const isMessage = testIsMessage(firstElement);

        if (isMessage) {
            const result = moveEngine.validateMove(targetLabelID, elements as Message[]);

            if (result.deniedElements.length > 0 && result.allowedElements.length === 0) {
                createNotification({
                    text: 'This action cannot be performed',
                    type: 'error',
                });

                return Promise.resolve();
            }

            // The actions would result in no change, so we can return
            if (result.notApplicableElements.length === elements.length || result.allowedElements.length === 0) {
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
