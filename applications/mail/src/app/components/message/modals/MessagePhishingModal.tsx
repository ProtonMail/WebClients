import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Prompt, useApi, useNotifications } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { reportPhishing } from '@proton/shared/lib/api/reports';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';

import { useMoveToFolder } from '../../../hooks/actions/move/useMoveToFolder';
import type { Element } from '../../../models/element';

const { SPAM } = MAILBOX_LABEL_IDS;

interface Props extends ModalProps {
    message: MessageState;
    onBack: () => void;
}

const MessagePhishingModal = ({ message, onBack, ...rest }: Props) => {
    const api = useApi();
    const { applyOptimisticLocationEnabled, applyLocation } = useApplyLocation();
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
        if (applyOptimisticLocationEnabled) {
            await applyLocation({
                type: APPLY_LOCATION_TYPES.MOVE,
                elements: [message.data || ({} as Element)],
                targetLabelID: SPAM,
                askUnsubscribe: false,
            });
        } else {
            await moveToFolder({
                elements: [message.data || ({} as Element)],
                sourceLabelID: '',
                destinationLabelID: SPAM,
                folderName: '',
                silent: true,
                askUnsub: false,
                sourceAction: SOURCE_ACTION.MESSAGE_VIEW,
            });
        }
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
