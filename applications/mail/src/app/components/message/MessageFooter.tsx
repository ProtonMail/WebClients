import { getAttachments } from 'proton-shared/lib/mail/messages';
import React from 'react';
import { classnames } from 'react-components';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';

import AttachmentList, { AttachmentAction } from '../attachment/AttachmentList';

interface Props {
    message: MessageExtended;

    /**
     * Needed for print message
     * true: (default) show download all button, clickable attachment
     * false: no buttons, only static content
     */
    showActions?: boolean;
}

const MessageFooter = ({ message, showActions = true }: Props) => {
    const attachments = getAttachments(message.data);

    return (
        <div
            className={classnames(['message-attachments border-top m0-5', !showActions && 'no-pointer-events'])}
            data-testid="message-attachments"
        >
            <AttachmentList
                attachments={attachments}
                embeddeds={message.embeddeds}
                message={message as MessageExtendedWithData}
                primaryAction={AttachmentAction.Preview}
                secondaryAction={showActions ? AttachmentAction.Download : AttachmentAction.None}
                collapsable={false}
                showDownloadAll={showActions}
                className="message-attachments-list"
            />
        </div>
    );
};

export default MessageFooter;
