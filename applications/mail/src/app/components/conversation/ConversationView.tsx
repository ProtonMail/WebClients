import React from 'react';
import { c } from 'ttag';
import { Loader, useLabels, useToggle, useApi, useEventManager, Icon } from 'react-components';
import { unlabelConversations } from 'proton-shared/lib/api/conversations';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import NumMessages from './NumMessages';
import ItemLabels from '../list/ItemLabels';
import { ConversationResult, useConversation } from '../../hooks/useConversation';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import TrashWarning from './TrashWarning';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { hasLabel } from '../../helpers/elements';
import { OnCompose } from '../../containers/ComposerContainer';
import { getNumParticipants } from '../../helpers/addresses';

interface Props {
    labelID: string;
    conversationID: string;
    messageID?: string;
    mailSettings: any;
    onBack: () => void;
    onCompose: OnCompose;
}

const ConversationView = ({ labelID, conversationID, mailSettings, onBack, onCompose }: Props) => {
    const [labels = []] = useLabels();
    const [conversationData, loading] = useConversation(conversationID);
    const { state: filter, toggle: toggleFilter } = useToggle(true);
    const api = useApi();
    const { call } = useEventManager();

    if (loading) {
        return <Loader />;
    }

    const { Conversation: conversation, Messages: messages = [] } = conversationData as ConversationResult;

    if (!conversation) {
        return null;
    }

    const inTrash = labelID === MAILBOX_LABEL_IDS.TRASH;
    const filteredMessages = messages.filter((message) => inTrash === hasLabel(message, MAILBOX_LABEL_IDS.TRASH));
    const messagesToShow = filter ? filteredMessages : messages;
    const showTrashWarning = filteredMessages.length !== messages.length;
    const numParticipants = getNumParticipants(conversation);

    const initialExpand = findMessageToExpand(labelID, messagesToShow)?.ID;

    const handleRemoveLabel = async (labelID: string) => {
        await api(unlabelConversations({ LabelID: labelID, IDs: [conversation.ID] }));
        await call();
    };

    return (
        <>
            <header className="border-bottom mw100 message-conversation-summary p0-5 pb1 flex-item-noshrink">
                <div className="flex flex-nowrap mb1">
                    <h2 className="mb0 h3 ellipsis lh-standard flex-item-fluid pr1" title={conversation.Subject}>
                        <NumMessages className="mr0-25" conversation={conversation} />
                        {conversation.Subject}
                    </h2>
                    <div className="flex-item-noshrink pt0-25">
                        <ItemStar element={conversation} />
                    </div>
                </div>
                <div className="flex flex-nowrap">
                    <div className="flex-item-fluid flex flex-items-center pr1">
                        <span className="mr1 flex flex-items-center flex-item-noshrink">
                            <Icon name="email-address" alt={c('label').t`Number of messages:`} />
                            <span className="ml0-25">{conversation.NumMessages}</span>
                        </span>
                        <span className="mr1 flex flex-items-center flex-item-noshrink">
                            <Icon name="contact" alt={c('label').t`Number of participants:`} />
                            <span className="ml0-25">{numParticipants}</span>
                        </span>
                    </div>
                    <div className="flex-item-noshrink">
                        <ItemLabels labels={labels} max={4} element={conversation} onUnlabel={handleRemoveLabel} />
                    </div>
                </div>

                {showTrashWarning && <TrashWarning inTrash={inTrash} filter={filter} onToggle={toggleFilter} />}
            </header>
            <div className="scroll-if-needed flex-item-fluid pt0-5 mw100">
                {messagesToShow.map((message, index) => (
                    <MessageView
                        labelID={labelID}
                        key={message.ID}
                        message={message}
                        initialExpand={message.ID === initialExpand}
                        labels={labels}
                        mailSettings={mailSettings}
                        conversationIndex={index}
                        onBack={onBack}
                        onCompose={onCompose}
                    />
                ))}
            </div>
        </>
    );
};

export default ConversationView;
