import { getAttachments } from '@proton/shared/lib/mail/messages';
import { classnames } from '@proton/components';
import AttachmentList, { AttachmentAction } from '../attachment/AttachmentList';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;

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
            className={classnames(['message-attachments m0-5', !showActions && 'no-pointer-events'])}
            data-testid="message-attachments"
        >
            <AttachmentList
                attachments={attachments}
                message={message as MessageStateWithData}
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
