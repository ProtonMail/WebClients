import { getAttachments } from '@proton/shared/lib/mail/messages';

import type { MessageState, MessageStateWithData, OutsideKey } from '../../store/messages/messagesTypes';
import AttachmentList, { AttachmentAction } from '../attachment/AttachmentList';

interface Props {
    message: MessageState;
    outsideKey?: OutsideKey;
}

const MessageFooter = ({ message, outsideKey }: Props) => {
    const attachments = getAttachments(message.data);

    return (
        <div className="message-attachments bg-norm rounded color-norm p-4 px-5" data-testid="message-attachments">
            <AttachmentList
                attachments={attachments}
                message={message as MessageStateWithData}
                primaryAction={AttachmentAction.Preview}
                secondaryAction={AttachmentAction.Download}
                collapsable={false}
                className="message-attachments-list"
                outsideKey={outsideKey}
            />
        </div>
    );
};

export default MessageFooter;
