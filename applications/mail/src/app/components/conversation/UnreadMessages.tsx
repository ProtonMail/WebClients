import { Button } from '@proton/atoms';
import { IcArrowDown } from '@proton/icons';

import { getNUnreadMessagesText } from 'proton-mail/helpers/text';

interface Props {
    messagesIDs?: string[];
    onClick: (messageID: string) => void;
}

const UnreadMessages = ({ messagesIDs, onClick }: Props) => {
    const unreadCount = messagesIDs?.length || 0;
    if (unreadCount === 0) {
        return null;
    }

    const handleClick = () => {
        if (messagesIDs) {
            onClick(messagesIDs[0]);
        }
    };

    const text = getNUnreadMessagesText(unreadCount);

    return (
        <span className="absolute inset-x-center bottom-0 pb-4" aria-live="assertive" aria-atomic="true">
            <Button
                pill
                color="norm"
                className="flex flex-nowrap items-center conversation-unread-messages"
                onClick={handleClick}
                data-testid="conversation-view:view-new-unread-message"
            >
                <span>{text}</span> <IcArrowDown className="ml-2" />
            </Button>
        </span>
    );
};

export default UnreadMessages;
