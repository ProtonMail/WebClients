import { useFolders, useLabels } from '@proton/mail/index';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import useFlag from '@proton/unleash/useFlag';

import { isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import type { Element } from 'proton-mail/models/element';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { labelMessages, unlabelMessages } from 'proton-mail/store/mailbox/mailboxActions';

export interface ApplyLocationParams {
    elements: Element[];
    targetLabelID: string;
    removeLabel: boolean;
    createFilters?: boolean;
    showSuccessNotification?: boolean;
}

export const useApplyLocation = () => {
    const enabled = useFlag('ApplyLabelsOptimisticRefactoring');
    const dispatch = useMailDispatch();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    const applyLocation = ({
        elements,
        removeLabel,
        targetLabelID,
        showSuccessNotification,
    }: ApplyLocationParams): Promise<any> => {
        const [firstElement] = elements;
        const isMessage = testIsMessage(firstElement);

        if (isMessage) {
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
        } else {
            throw new Error('Not implemented');
        }
    };

    return { enabled, applyLocation };
};
