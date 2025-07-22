import useFlag from '@proton/unleash/useFlag';

import { isMessage as testIsMessage } from 'proton-mail/helpers/elements';
import { getLabelName } from 'proton-mail/helpers/labels';
import type { Element } from 'proton-mail/models/element';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { labelMessages, unlabelMessages } from 'proton-mail/store/mailbox/mailboxActions';

export interface ApplyLocationParams {
    elements: Element[];
    destinationLabelID: string;
    action: 'label' | 'unlabel';
    createFilters?: boolean;
    showSuccessNotification?: boolean;
}

export const useApplyLocation = () => {
    const enabled = useFlag('ApplyLabelsOptimisticRefactoring');
    const dispatch = useMailDispatch();

    const applyLocation = ({ elements, action, destinationLabelID, showSuccessNotification }: ApplyLocationParams) => {
        const [firstElement] = elements;
        const isMessage = testIsMessage(firstElement);

        if (isMessage) {
            if (action === 'label') {
                void dispatch(
                    labelMessages({
                        elements,
                        labelID: destinationLabelID,
                        labelName: getLabelName(destinationLabelID),
                        isEncryptedSearch: false,
                        showSuccessNotification,
                    })
                );
            } else {
                void dispatch(
                    unlabelMessages({
                        elements,
                        labelID: destinationLabelID,
                        labelName: getLabelName(destinationLabelID),
                        isEncryptedSearch: false,
                        showSuccessNotification,
                    })
                );
            }
        }

        throw new Error('Not implemented');
    };

    return { enabled, applyLocation };
};
