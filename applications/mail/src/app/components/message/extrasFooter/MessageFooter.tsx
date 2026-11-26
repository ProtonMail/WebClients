import { AttachmentAction } from '@proton/mail-composer/attachments/attachmentListTypes';
import type { MessageState, MessageStateWithData, OutsideKey } from '@proton/mail-message/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments } from '@proton/shared/lib/mail/messages';

import AttachmentList from './attachment/AttachmentList';

interface Props {
    message: MessageState;
    outsideKey?: OutsideKey;
    onSaveToDrive?: (attachment: Attachment) => Promise<void>;
}

const MessageFooter = ({ message, outsideKey, onSaveToDrive }: Props) => {
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
                onSaveToDrive={onSaveToDrive}
            />
        </div>
    );
};

export default MessageFooter;
