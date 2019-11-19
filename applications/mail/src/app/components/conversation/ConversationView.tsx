import React, { useEffect, useState } from 'react';
import { useLoading, Loader, useLabels } from 'react-components';
import { orderBy } from 'proton-shared/lib/helpers/array';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';
import { useConversations } from '../../hooks/useConversations';
import { Message } from '../../models/message';

interface Props {
    conversationID: string;
    messageID?: string;
    mailSettings: any;
}

const ConversationView = ({ conversationID, messageID, mailSettings }: Props) => {
    const [conversation, updateConversation] = useState();
    const [messages, updateMessages] = useState<Message[]>([]);
    const [labels] = useLabels();
    const [loading, withLoading] = useLoading();
    const [initialExpand, setInitialExpand] = useState(null);
    const { getConversation } = useConversations();

    const requestConversation = async () => {
        const { Conversation, Messages = [] } = await getConversation(conversationID, messageID);
        const messages = orderBy(Messages, 'Order');
        updateConversation(Conversation);
        updateMessages(messages);
        if (messages.length > 0) {
            setInitialExpand(messages[messages.length - 1].ID);
        }
    };

    useEffect(() => {
        withLoading(requestConversation());
    }, [conversationID, messageID]);

    if (loading) {
        return <Loader />;
    }

    if (!conversation) {
        return null;
    }

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
