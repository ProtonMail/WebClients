import { c } from 'ttag';

import { AlertModal, Button, ErrorButton, ModalProps, useApi, useNotifications } from '@proton/components';
import { reportPhishing } from '@proton/shared/lib/api/reports';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMoveToFolder } from '../../../hooks/useApplyLabels';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { Element } from '../../../models/element';

const { SPAM } = MAILBOX_LABEL_IDS;

interface Props extends ModalProps {
    message: MessageState;
    onBack: () => void;
}

const MessagePhishingModal = ({ message, onBack, ...rest }: Props) => {
    const api = useApi();
    const { moveToFolder } = useMoveToFolder();
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

        await moveToFolder([message.data || ({} as Element)], SPAM, '', '', true, false);
        createNotification({ text: c('Success').t`Phishing reported` });
        onBack();
    };

    return (
        <AlertModal
            title={c('Info').t`Confirm phishing report`}
            buttons={[
                <ErrorButton onClick={handleConfirmPhishing}>{c('Action').t`Confirm`}</ErrorButton>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Reporting a message as a phishing attempt will send the message to us, so we can analyze it and improve our filters. This means that we will be able to see the contents of the message in full.`}
        </AlertModal>
    );
};

export default MessagePhishingModal;
