import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useState, useEffect } from 'react';
import { c, msgid } from 'ttag';
import { Icon } from 'react-components';
import { isUnread } from '../../helpers/elements';

interface Props {
    conversationID: string;
    messages?: Message[];
    onClick: (messageID: string) => void;
}

const UnreadMessages = ({ conversationID, messages, onClick }: Props) => {
    const [count, setCount] = useState(0);
    const [initials, setInitials] = useState(messages);

    const newUnreads = () => {
        if (initials === undefined || messages === undefined) {
            return [];
        }

        const initialsIDs = initials.map((message) => message.ID);
        return messages
            .filter((message) => !initialsIDs.includes(message.ID))
            .filter((message) => isUnread(message, undefined));
    };

    // Reset initials if conversation changed
    useEffect(() => {
        setInitials(messages);
    }, [conversationID]);

    // Reset initials if messages are loaded
    useEffect(() => {
        if (initials === undefined && Array.isArray(messages)) {
            setInitials(messages);
        }
    }, [messages]);

    // Update unreads count
    useEffect(() => setCount(newUnreads().length)); // No deps not to miss unread change status on newUnreads

    if (count === 0) {
        return null;
    }

    const handleClick = () => onClick(newUnreads()[0].ID);

    const text = c('Info').ngettext(msgid`${count} unread message`, `${count} unread messages`, count);

    return (
        <span className="absolute centered-absolute-horizontal bottom pb1" aria-live="assertive" aria-atomic="true">
            <button
                className="pm-button pm-button--primary pm-button--pill flex flex-nowrap flex-items-center conversation-unread-messages"
                type="button"
                onClick={handleClick}
            >
                <span>{text}</span> <Icon name="arrow-down" className="ml0-5" />
            </button>
        </span>
    );
};

export default UnreadMessages;
