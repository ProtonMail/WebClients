import React from 'react';
import { Loader, useLabels } from 'react-components';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';
import { useConversation } from '../../hooks/useConversation';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';

interface Props {
    labelID: string;
    conversationID: string;
    messageID?: string;
    mailSettings: any;
}

const ConversationView = ({ labelID, conversationID, mailSettings }: Props) => {
    const [labels] = useLabels();
    const [conversationData, loading] = useConversation(conversationID);

    if (loading) {
        return <Loader />;
    }

    const { Conversation: conversation, Messages: messages = [] } = conversationData;

    if (!conversation) {
        return null;
    }

    const initialExpand = findMessageToExpand(labelID, messages).ID;

    return (
        <>
            <header className="flex flex-nowrap flex-spacebetween flex-items-center mb1">
                <h2 className="mb0">
                    <NumMessages className="mr0-25" conversation={conversation} />
                    {conversation.Subject}
                </h2>
                <div>
                    <ItemLabels labels={labels} max={4} element={conversation} type={ELEMENT_TYPES.CONVERSATION} />
                    <ItemStar element={conversation} type={ELEMENT_TYPES.CONVERSATION} />
                </div>
            </header>
            {messages.map((message, index) => (
                <MessageView
                    key={message.ID}
                    message={message}
                    initialExpand={message.ID === initialExpand}
                    labels={labels}
                    mailSettings={mailSettings}
                    conversationIndex={index}
                />
            ))}
        </>
    );
};

export default ConversationView;
