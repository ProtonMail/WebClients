import { useState } from 'react';
import { useHistory } from 'react-router';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import type { PublicKeyReference } from '@proton/crypto';
import { EO_REPLY_NUM_ATTACHMENTS_LIMIT } from '@proton/shared/lib/mail/eo/constants';

import { EO_MAX_REPLIES_NUMBER, EO_MESSAGE_REDIRECT_PATH } from '../../../constants';
import { useSendEO } from '../../../hooks/eo/useSendEO';
import type { MessageKeys, MessageState } from '../../../store/messages/messagesTypes';
import AttachmentsButton from '../../attachment/AttachmentsButton';

interface Props {
    id: string;
    onAddAttachments: (files: File[]) => void;
    message: MessageState;
    encryptionKey?: PublicKeyReference;
    outsideKey?: MessageKeys;
    numberOfReplies: number;
}

const EOReplyFooter = ({ id, onAddAttachments, message, encryptionKey, outsideKey, numberOfReplies }: Props) => {
    const history = useHistory();

    const [isSending, setIsSending] = useState(false);

    const isUnderLimit = numberOfReplies < EO_MAX_REPLIES_NUMBER;

    const canSend = !isSending && isUnderLimit;

    const { send } = useSendEO({
        message,
        encryptionKey,
        outsideKey,
    });

    const handleSend = async () => {
        setIsSending(true);

        try {
            await send();
        } catch {
            setIsSending(false);
        }
    };

    const handleCancel = () => {
        history.push(`${EO_MESSAGE_REDIRECT_PATH}/${id}`);
    };

    const sendButton = (
        <Button
            className="ml-4"
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

    const canAddAttachment = (message.data?.Attachments.length || 0) < 10;
    const attachmentButton = (
        <AttachmentsButton
            onAddAttachments={onAddAttachments}
            data-testid="eo-composer:attachment-button"
            disabled={!canAddAttachment}
        />
    );

    return (
        <div className="flex justify-space-between border-top p-4 mx-3">
            <Button size="large" color="weak" type="button" onClick={handleCancel}>
                {c('Action').t`Cancel`}
            </Button>
            <div className="flex">
                {canAddAttachment ? (
                    attachmentButton
                ) : (
                    /*
                     * translator: EO_REPLY_NUM_ATTACHMENTS_LIMIT is the number of attachments maximum that we can have in an encrypted outside message
                     * Currently it's 10 written in digits
                     */
                    <Tooltip
                        title={c('Info').t`Maximum number of attachments (${EO_REPLY_NUM_ATTACHMENTS_LIMIT}) exceeded.`}
                    >
                        <span className="flex">{attachmentButton}</span>
                    </Tooltip>
                )}

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
