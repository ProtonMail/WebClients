import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useApi, useLoading, Loader } from 'react-components';
import { getConversation } from 'proton-shared/lib/api/conversations';

import MessageView from './MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';

const ConversationView = ({ conversationID, messageID }) => {
    const [conversation, updateConversation] = useState({});
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

    return (
        <section className="view-column-detail p2 flex-item-fluid scroll-if-needed">
            <header className="flex flex-nowrap flex-spacebetween flex-items-center">
                <h2>{conversation.Subject}</h2>
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
