import { classnames } from '@proton/components';
import { getAttachments } from '@proton/shared/lib/mail/messages';

import { MessageState, MessageStateWithData, OutsideKey } from '../../logic/messages/messagesTypes';
import AttachmentList, { AttachmentAction } from '../attachment/AttachmentList';

interface Props {
    message: MessageState;
    outsideKey?: OutsideKey;
}

const MessageFooter = ({ message, outsideKey }: Props) => {
    const attachments = getAttachments(message.data);

    return (
        <div className={classnames(['message-attachments bg-norm color-norm p1'])} data-testid="message-attachments">
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
