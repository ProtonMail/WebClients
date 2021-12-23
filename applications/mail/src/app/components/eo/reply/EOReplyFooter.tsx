import { useState } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router';
import { OpenPGPKey } from 'pmcrypto';

import { Button } from '@proton/components';

import AttachmentsButton from '../../attachment/AttachmentsButton';
import { MessageKeys, MessageState } from '../../../logic/messages/messagesTypes';
import { useSendEO } from '../../../hooks/eo/useSendEO';
import { EO_MESSAGE_REDIRECT_PATH } from '../../../constants';

interface Props {
    id: string;
    onAddAttachments: (files: File[]) => void;
    message: MessageState;
    publicKeys?: OpenPGPKey[];
    outsideKey?: MessageKeys;
}

const EOReplyFooter = ({ id, onAddAttachments, message, publicKeys, outsideKey }: Props) => {
    const history = useHistory();

    const [isSending, setIsSending] = useState(false);

    const { send } = useSendEO({
        message,
        publicKeys,
        outsideKey,
    });

    const handleSend = async () => {
        setIsSending(true);

        await send();

        setIsSending(false);
    };

    const handleCancel = () => {
        history.push(`${EO_MESSAGE_REDIRECT_PATH}/${id}`);
    };

    return (
        <div className="flex flex-justify-space-between border-top p1">
            <Button size="large" color="weak" type="button" onClick={handleCancel}>
                {c('Action').t`Cancel`}
            </Button>
            <div className="flex">
                <AttachmentsButton onAddAttachments={onAddAttachments} data-testid="eo-composer:attachment-button" />
                <Button
                    className="ml1"
                    size="large"
                    color="norm"
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                >
                    {c('Action').t`Send`}
                </Button>
            </div>
        </div>
    );
};

export default EOReplyFooter;
