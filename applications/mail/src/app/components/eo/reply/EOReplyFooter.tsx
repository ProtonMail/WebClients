import { useState } from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router';
import { OpenPGPKey } from 'pmcrypto';

import { Button, Tooltip } from '@proton/components';

import AttachmentsButton from '../../attachment/AttachmentsButton';
import { MessageKeys, MessageState } from '../../../logic/messages/messagesTypes';
import { useSendEO } from '../../../hooks/eo/useSendEO';
import { EO_MAX_REPLIES_NUMBER, EO_MESSAGE_REDIRECT_PATH } from '../../../constants';

interface Props {
    id: string;
    onAddAttachments: (files: File[]) => void;
    message: MessageState;
    publicKeys?: OpenPGPKey[];
    outsideKey?: MessageKeys;
    numberOfReplies: number;
}

const EOReplyFooter = ({ id, onAddAttachments, message, publicKeys, outsideKey, numberOfReplies }: Props) => {
    const history = useHistory();

    const [isSending, setIsSending] = useState(false);

    const isUnderLimit = numberOfReplies < EO_MAX_REPLIES_NUMBER;

    const canSend = !isSending && isUnderLimit;

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

    const sendButton = (
        <Button
            className="ml1"
            size="large"
            color="norm"
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            data-testid="send-eo"
        >
            {c('Action').t`Send`}
        </Button>
    );

    return (
        <div className="flex flex-justify-space-between border-top p1">
            <Button size="large" color="weak" type="button" onClick={handleCancel}>
                {c('Action').t`Cancel`}
            </Button>
            <div className="flex">
                <AttachmentsButton onAddAttachments={onAddAttachments} data-testid="eo-composer:attachment-button" />
                {isUnderLimit ? (
                    sendButton
                ) : (
                    <Tooltip title={c('Info').t`You have reached the maximum number of 5 replies.`}>
                        <span>{sendButton}</span>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

export default EOReplyFooter;
