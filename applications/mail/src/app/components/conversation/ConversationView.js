import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useApi, useLoading, Loader } from 'react-components';
import { getConversation } from 'proton-shared/lib/api/conversations';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import NumMessages from './NumMessages';

const ConversationView = ({ conversationID, messageID, mailSettings }) => {
    const [conversation, updateConversation] = useState();
    const [messages, updateMessages] = useState([]);
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const requestConversation = async () => {
        const { Conversation, Messages = [] } = await api(getConversation(conversationID, messageID));
        updateConversation(Conversation);
        updateMessages(Messages);
    };

    useEffect(() => {
        withLoading(requestConversation());
    }, []);

    if (loading) {
        return (
            <section className="view-column-detail p2 flex-item-fluid scroll-if-needed">
                <Loader />
            </section>
        );
    }

    if (!conversation) {
        return null;
    }

    return (
        <section className="view-column-detail p2 flex-item-fluid scroll-if-needed">
            <header className="flex flex-nowrap flex-spacebetween flex-items-center mb1">
                <h2 className="mb0">
                    <NumMessages mailSettings={mailSettings} className="mr0-25" conversation={conversation} />
                    {conversation.Subject}
                </h2>
                <ItemStar element={conversation} type={ELEMENT_TYPES.CONVERSATION} />
            </header>
            {messages.map((message) => (
                <MessageView key={message.ID} message={message} />
            ))}
        </section>
    );
};

ConversationView.propTypes = {
    conversationID: PropTypes.string.isRequired,
    messageID: PropTypes.string,
    mailSettings: PropTypes.object.isRequired
};

export default ConversationView;
