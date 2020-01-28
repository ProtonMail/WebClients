import React from 'react';
import { Loader, useLabels, useToggle } from 'react-components';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';
import { useConversation } from '../../hooks/useConversation';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import TrashWarning from './TrashWarning';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { hasLabel } from '../../helpers/elements';
import { OnCompose } from '../../containers/ComposerContainer';

interface Props {
    labelID: string;
    conversationID: string;
    messageID?: string;
    mailSettings: any;
    onCompose: OnCompose;
}

const ConversationView = ({ labelID, conversationID, mailSettings, onCompose }: Props) => {
    const [labels] = useLabels();
    const [conversationData, loading] = useConversation(conversationID);
    const { state: filter, toggle: toggleFilter } = useToggle(true);

    if (loading) {
        return <Loader />;
    }

    const { Conversation: conversation, Messages: messages = [] } = conversationData;

    if (!conversation) {
        return null;
    }

    const inTrash = labelID === MAILBOX_LABEL_IDS.TRASH;
    const filteredMessages = messages.filter((message) => inTrash === hasLabel(message, MAILBOX_LABEL_IDS.TRASH));
    const messagesToShow = filter ? filteredMessages : messages;
    const showTrashWarning = filteredMessages.length !== messages.length;

    const initialExpand = findMessageToExpand(labelID, messagesToShow).ID;

    return (
        <>
            <header className="flex flex-column mb1">
                <div className="flex flex-nowrap flex-spacebetween flex-items-center mb1">
                    <h2 className="mb0">
                        <NumMessages className="mr0-25" conversation={conversation} />
                        {conversation.Subject}
                    </h2>
                    <div>
                        <ItemLabels labels={labels} max={4} element={conversation} />
                        <ItemStar element={conversation} type={ELEMENT_TYPES.CONVERSATION} />
                    </div>
                </div>
                {showTrashWarning && <TrashWarning inTrash={inTrash} filter={filter} onToggle={toggleFilter} />}
            </header>
            {messagesToShow.map((message, index) => (
                <MessageView
                    key={message.ID}
                    message={message}
                    initialExpand={message.ID === initialExpand}
                    labels={labels}
                    mailSettings={mailSettings}
                    conversationIndex={index}
                    onCompose={onCompose}
                />
            ))}
        </>
    );
};

export default ConversationView;
