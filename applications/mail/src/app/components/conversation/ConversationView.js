import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useApi, useLoading, Loader, useLabels } from 'react-components';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { orderBy } from 'proton-shared/lib/helpers/array';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';

const ConversationView = ({ conversationID, messageID, mailSettings }) => {
    const [conversation, updateConversation] = useState();
    const [messages, updateMessages] = useState([]);
    const [labels] = useLabels();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [initialExpand, setInitialExpand] = useState(null);

    const requestConversation = async () => {
        const { Conversation, Messages = [] } = await api(getConversation(conversationID, messageID));
        const messages = orderBy(Messages, 'Order');
        updateConversation(Conversation);
        updateMessages(messages);
        if (messages.length > 0) {
            setInitialExpand(messages[messages.length - 1].ID);
        }
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
        </section>
    );
};

ConversationView.propTypes = {
    conversationID: PropTypes.string.isRequired,
    messageID: PropTypes.string,
    mailSettings: PropTypes.object.isRequired
};

export default ConversationView;
