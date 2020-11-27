import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useEffect, memo, useRef, useState } from 'react';
import { useLabels, useToggle, classnames } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import { isDraft } from 'proton-shared/lib/mail/messages';
import MessageView, { MessageViewRef } from '../message/MessageView';
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
    const messageViewsRefs = useRef({} as { [messageID: string]: MessageViewRef | undefined });
    const [firstOpening, setFirstOpening] = useState(true);

    const { Conversation: conversation = {}, Messages: inputMessages = [] } = conversationResult || {};
    const messages = usePlaceholders(inputMessages, loadingMessages, conversation?.NumMessages || 1) as Message[];

    const inTrash = labelID === TRASH;
    const filteredMessages = messages.filter((message) => inTrash === hasLabel(message, TRASH));
    const messagesToShow = !loadingMessages && filter ? filteredMessages : messages;
    const showTrashWarning = !loadingMessages && filteredMessages.length !== messages.length;
    const messageInUrl = conversationResult?.Messages?.find((message) => message.ID === messageID);

    const openMessage = (messageID: string | undefined) => {
        messageViewsRefs.current[messageID || '']?.open(!firstOpening);
        setFirstOpening(false);
    };

    // Open the first message of a conversation if none selected in URL
    useEffect(() => {
        if (!loadingMessages && !messageID) {
            openMessage(findMessageToExpand(labelID, messagesToShow)?.ID);
        }
    }, [conversationID, loadingMessages]);

    // Open the message in URL
    useEffect(() => {
        if (!loadingMessages && messageID && !isDraft(messageInUrl)) {
            openMessage(messageID);
        }
    }, [conversationID, messageID, loadingMessages, isDraft(messageInUrl)]);

    useEffect(() => {
        setFilter(DEFAULT_FILTER_VALUE);
    }, [inputConversationID]);

    const handleClickUnread = (messageID: string) => {
        openMessage(messageID);
    };

    return (
        <>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={loadingConversation}
                element={conversation}
                labelID={labelID}
                breakpoints={breakpoints}
            />
            <div className={classnames(['scroll-if-needed flex-item-fluid pt0-5 mw100', hidden && 'hidden'])}>
                {showTrashWarning && <TrashWarning inTrash={inTrash} filter={filter} onToggle={toggleFilter} />}
                {messagesToShow.map((message, index) => (
                    <MessageView
                        key={message.ID}
                        ref={(ref) => {
                            messageViewsRefs.current[message.ID] = ref || undefined;
                        }}
                        labelID={labelID}
                        conversationMode
                        loading={loadingMessages}
                        message={message}
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
