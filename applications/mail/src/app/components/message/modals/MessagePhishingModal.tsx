import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { reportPhishing } from '@proton/shared/lib/api/reports';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from '../../../hooks/actions/applyLocation/interface';
import { useApplyLocation } from '../../../hooks/actions/applyLocation/useApplyLocation';
import type { Element } from '../../../models/element';

interface Props extends ModalProps {
    message: MessageState;
    onBack: () => void;
}

const MessagePhishingModal = ({ message, onBack, ...rest }: Props) => {
    const api = useApi();
    const { applyLocation } = useApplyLocation();
    const { createNotification } = useNotifications();

    const { onClose } = rest;

    // Reference: Angular/src/app/bugReport/factories/bugReportModel.js
    const handleConfirmPhishing = async () => {
        onClose?.();

        await api(
            reportPhishing({
                MessageID: message.data?.ID,
                MIMEType: message.data?.MIMEType === 'text/plain' ? 'text/plain' : 'text/html', // Accept only 'text/plain' / 'text/html'
                Body: message.decryption?.decryptedBody,
            })
        );
        await applyLocation({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [message.data || ({} as Element)],
            destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
            askUnsubscribe: false,
        });

        createNotification({ text: c('Success').t`Phishing reported` });
        onBack();
    };

    return (
        <Prompt
            title={c('Info').t`Confirm phishing report`}
            buttons={[
                <Button color="danger" onClick={handleConfirmPhishing}>{c('Action').t`Confirm`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Reporting a message as a phishing attempt will send the message to us, so we can analyze it and improve our filters. This means that we will be able to see the contents of the message in full.`}
        </Prompt>
    );
};

export default MessagePhishingModal;
