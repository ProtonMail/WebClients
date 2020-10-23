import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useState, useEffect, memo } from 'react';
import { useLabels, useToggle, classnames } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import MessageView from '../message/MessageView';
import { useConversation } from '../../hooks/useConversation';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import TrashWarning from './TrashWarning';
import { hasLabel } from '../../helpers/elements';
import { OnCompose } from '../../hooks/useCompose';
import { useShouldMoveOut } from '../../hooks/useShouldMoveOut';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import ConversationHeader from './ConversationHeader';
import { Breakpoints } from '../../models/utils';
import UnreadMessages from './UnreadMessages';

const { TRASH } = MAILBOX_LABEL_IDS;

interface Props {
    hidden: boolean;
    labelID: string;
    conversationID: string;
    messageID?: string;
    mailSettings: any;
    onBack: () => void;
    onCompose: OnCompose;
    breakpoints: Breakpoints;
}

const DEFAULT_FILTER_VALUE = true;

const ConversationView = ({
    hidden,
    labelID,
    conversationID: inputConversationID,
    messageID,
    mailSettings,
    onBack,
    onCompose,
    breakpoints,
}: Props) => {
    const [labels = []] = useLabels();
    const {
        conversationID,
        conversation: conversationResult,
        pendingRequest,
        loadingConversation,
        loadingMessages,
    } = useConversation(inputConversationID, messageID);
    const { state: filter, toggle: toggleFilter, set: setFilter } = useToggle(DEFAULT_FILTER_VALUE);
    useShouldMoveOut(true, conversationID, pendingRequest, onBack);

    const { Conversation: conversation = {}, Messages: inputMessages = [] } = conversationResult || {};
    const messages = usePlaceholders(inputMessages, loadingMessages, conversation?.NumMessages || 1) as Message[];

    const inTrash = labelID === TRASH;
    const filteredMessages = messages.filter((message) => inTrash === hasLabel(message, TRASH));
    const messagesToShow = !loadingMessages && filter ? filteredMessages : messages;
    const showTrashWarning = !loadingMessages && filteredMessages.length !== messages.length;

    const initExpand = () => {
        if (messageID) {
            return messageID;
        }

        return findMessageToExpand(labelID, messagesToShow)?.ID;
    };

    const [expand, setExpand] = useState(initExpand);

    useEffect(() => {
        setExpand(initExpand());
    }, [conversationID, messageID, loadingMessages]);

    useEffect(() => {
        setFilter(DEFAULT_FILTER_VALUE);
    }, [inputConversationID]);

    const handleClickUnread = (messageID: string) => {
        setExpand(messageID);
    };

    return (
        <>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={loadingConversation}
                element={conversation}
                breakpoints={breakpoints}
            />
            <div className={classnames(['scroll-if-needed flex-item-fluid pt0-5 mw100', hidden && 'hidden'])}>
                {showTrashWarning && <TrashWarning inTrash={inTrash} filter={filter} onToggle={toggleFilter} />}
                {messagesToShow.map((message, index) => (
                    <MessageView
                        key={message.ID}
                        labelID={labelID}
                        conversationMode
                        loading={loadingMessages}
                        message={message}
                        expand={message.ID === expand}
                        labels={labels}
                        mailSettings={mailSettings}
                        conversationIndex={index}
                        conversationID={conversationID}
                        onBack={onBack}
                        onCompose={onCompose}
                        breakpoints={breakpoints}
                    />
                ))}
            </div>
            <UnreadMessages
                conversationID={conversationID}
                messages={conversationResult?.Messages}
                onClick={handleClickUnread}
            />
        </>
    );
};

export default memo(ConversationView);
