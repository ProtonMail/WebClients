import React from 'react';
import { Conversation } from '../../models/conversation';

interface Props {
    conversation: Conversation;
    className?: string;
}

const NumMessages = ({ conversation, className }: Props) => {
    // ContextNumMessages shoud not be used
    const { NumMessages = 0 } = conversation;

    if (NumMessages <= 1) {
        return null;
    }

    return <span className={className}>({NumMessages})</span>;
};

export default NumMessages;
