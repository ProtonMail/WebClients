import React, { useEffect, memo, useRef } from 'react';
import { useLabels, useToggle, classnames } from 'react-components';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { isDraft } from 'proton-shared/lib/mail/messages';

import MessageView, { MessageViewRef } from '../message/MessageView';
import { useConversation } from '../../hooks/conversation/useConversation';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import TrashWarning from './TrashWarning';
import { hasLabel } from '../../helpers/elements';
import { OnCompose } from '../../hooks/composer/useCompose';
import { useShouldMoveOut } from '../../hooks/useShouldMoveOut';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import ConversationHeader from './ConversationHeader';
import { Breakpoints } from '../../models/utils';

import UnreadMessages from './UnreadMessages';
import { useConversationFocus } from '../../hooks/conversation/useConversationFocus';
import { useConversationHotkeys } from '../../hooks/conversation/useConversationHotkeys';

const { TRASH } = MAILBOX_LABEL_IDS;

interface Props {
    hidden: boolean;
    labelID: string;
    conversationID: string;
    messageID?: string;
    mailSettings: MailSettings;
    onBack: () => void;
    onCompose: OnCompose;
    breakpoints: Breakpoints;
    onMessageReady: () => void;
    columnLayout: boolean;
    isComposerOpened: boolean;
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
    onMessageReady,
    columnLayout,
    isComposerOpened,
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

    const { Conversation: conversation = {}, Messages: inputMessages = [] } = conversationResult || {};
    const messages = usePlaceholders(inputMessages, loadingMessages, conversation?.NumMessages || 1) as Message[];

    const inTrash = labelID === TRASH;
    const filteredMessages = messages.filter((message) => inTrash === hasLabel(message, TRASH));
    const messagesToShow = !loadingMessages && filter ? filteredMessages : messages;
    const showTrashWarning = !loadingMessages && filteredMessages.length !== messages.length;
    const messageInUrl = conversationResult?.Messages?.find((message) => message.ID === messageID);

    const expandMessage = (messageID: string | undefined) => {
        messageViewsRefs.current[messageID || '']?.expand();
    };

    // Open the first message of a conversation if none selected in URL
    useEffect(() => {
        if (!loadingMessages && !messageID) {
            expandMessage(findMessageToExpand(labelID, messagesToShow)?.ID);
        }
    }, [conversationID, messageID, loadingMessages]);

    // Open the message in URL
    useEffect(() => {
        if (!loadingMessages && messageID && !isDraft(messageInUrl)) {
            expandMessage(messageID);
        }
    }, [conversationID, messageID, loadingMessages, messageInUrl]);

    useEffect(() => {
        setFilter(DEFAULT_FILTER_VALUE);
    }, [inputConversationID]);

    const handleClickUnread = (messageID: string) => {
        expandMessage(messageID);
    };

    const { focusIndex, handleFocus, getFocusedId } = useConversationFocus(messagesToShow);

    const { elementRef } = useConversationHotkeys(
        { messages: messagesToShow, focusIndex },
        { handleFocus, getFocusedId, expandMessage }
    );

    const trashWarningRef = useRef<HTMLDivElement>(null);
    const onlyTrashInConversation = !loadingMessages && !filteredMessages.length;

    useEffect(() => {
        if (onlyTrashInConversation) {
            // unblock J/K shortcuts
            setTimeout(onMessageReady);
            if (!columnLayout) {
                trashWarningRef.current?.focus();
            }
        }
    }, [onlyTrashInConversation, conversationID, columnLayout]);

    return (
        <>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={loadingConversation}
                element={conversation}
                labelID={labelID}
            />
            <div
                className={classnames(['flex-item-fluid pt0-5 pr1-5 pl1-5 max-w100 no-outline', hidden && 'hidden'])}
                ref={elementRef}
                tabIndex={-1}
            >
                {showTrashWarning && (
                    <TrashWarning ref={trashWarningRef} inTrash={inTrash} filter={filter} onToggle={toggleFilter} />
                )}
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
                        onFocus={handleFocus}
                        onMessageReady={onMessageReady}
                        columnLayout={columnLayout}
                        isComposerOpened={isComposerOpened}
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
