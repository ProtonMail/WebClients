import { memo, useEffect, useRef } from 'react';
import * as React from 'react';

import { Scroll, classnames, useLabels, useToggle } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft } from '@proton/shared/lib/mail/messages';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { hasLabel } from '../../helpers/elements';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { useConversation } from '../../hooks/conversation/useConversation';
import { useConversationFocus } from '../../hooks/conversation/useConversationFocus';
import { useConversationHotkeys } from '../../hooks/conversation/useConversationHotkeys';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import { useShouldMoveOut } from '../../hooks/useShouldMoveOut';
import { Breakpoints } from '../../models/utils';
import MessageView, { MessageViewRef } from '../message/MessageView';
import ConversationErrorBanner from './ConversationErrorBanner';
import ConversationHeader from './ConversationHeader';
import TrashWarning from './TrashWarning';
import UnreadMessages from './UnreadMessages';

const { TRASH } = MAILBOX_LABEL_IDS;

interface Props {
    hidden: boolean;
    labelID: string;
    conversationID: string;
    messageID?: string;
    mailSettings: MailSettings;
    onBack: () => void;
    breakpoints: Breakpoints;
    onMessageReady: () => void;
    columnLayout: boolean;
    isComposerOpened: boolean;
    containerRef: React.RefObject<HTMLElement>;
}

const DEFAULT_FILTER_VALUE = true;

const ConversationView = ({
    hidden,
    labelID,
    conversationID: inputConversationID,
    messageID,
    mailSettings,
    onBack,
    breakpoints,
    onMessageReady,
    columnLayout,
    isComposerOpened,
    containerRef,
}: Props) => {
    const { isSearchResult } = useEncryptedSearchContext();
    const [labels = []] = useLabels();
    const {
        conversationID,
        conversation: conversationState,
        pendingRequest,
        loadingConversation,
        loadingMessages,
        handleRetry,
    } = useConversation(inputConversationID, messageID);
    const { state: filter, toggle: toggleFilter, set: setFilter } = useToggle(DEFAULT_FILTER_VALUE);
    useShouldMoveOut(true, conversationID, pendingRequest, onBack);
    const messageViewsRefs = useRef({} as { [messageID: string]: MessageViewRef | undefined });

    const wrapperRef = useRef<HTMLDivElement>(null);

    const { Conversation: conversation, Messages: inputMessages = [] } = conversationState || {};
    const messages = usePlaceholders(inputMessages, loadingMessages, conversation?.NumMessages || 1) as Message[];

    const inTrash = labelID === TRASH;
    const filteredMessages = messages.filter(
        (message) => inTrash === hasLabel(message, TRASH) || isSearchResult(message.ID)
    );
    const messagesToShow = !loadingMessages && filter ? filteredMessages : messages;
    const showTrashWarning = !loadingMessages && filteredMessages.length !== messages.length;
    const messageInUrl = conversationState?.Messages?.find((message) => message.ID === messageID);
    const loading = loadingConversation || loadingMessages;
    const showConversationError = !loading && conversationState?.Conversation?.Subject === undefined;
    const showMessagesError = !loading && !showConversationError && !conversationState?.Messages;

    const { focusIndex, handleFocus, handleBlur, getFocusedId } = useConversationFocus(messagesToShow);

    const expandMessage = (messageID: string | undefined, scrollTo = false) => {
        messageViewsRefs.current[messageID || '']?.expand();
        const index = messages.findIndex((message) => message.ID === messageID);
        if (index !== undefined) {
            handleFocus(index, scrollTo);
        }
    };

    const { elementRef } = useConversationHotkeys(
        { messages: messagesToShow, focusIndex },
        { handleFocus, getFocusedId, expandMessage }
    );

    // Open the first message of a conversation if none selected in URL
    useEffect(() => {
        if (!loadingMessages && !messageID) {
            expandMessage(findMessageToExpand(labelID, messagesToShow)?.ID);
        }
    }, [conversationID, messageID, loadingMessages]);

    // Open the message in URL
    useEffect(() => {
        if (!loadingMessages && messageID && !isDraft(messageInUrl)) {
            expandMessage(messageID, true);
        }
    }, [conversationID, messageID, loadingMessages, messageInUrl]);

    useEffect(() => {
        setFilter(DEFAULT_FILTER_VALUE);
    }, [inputConversationID]);

    const handleClickUnread = (messageID: string) => {
        expandMessage(messageID);
    };

    const trashWarningRef = useRef<HTMLDivElement>(null);
    const onlyTrashInConversation = !loadingMessages && !filteredMessages.length;

    useEffect(() => {
        if (onlyTrashInConversation) {
            // unblock J/K shortcuts
            setTimeout(onMessageReady);
            if (!columnLayout) {
                trashWarningRef.current?.parentElement?.focus();
            }
        }
    }, [onlyTrashInConversation, conversationID, columnLayout]);

    return showConversationError ? (
        <ConversationErrorBanner errors={conversationState?.errors} onRetry={handleRetry} />
    ) : (
        <>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={loadingConversation}
                element={conversation}
            />
            <Scroll className={classnames([hidden && 'hidden'])} customContainerRef={containerRef}>
                <div ref={wrapperRef} className="flex-item-fluid pt1 pr1 pl1 w100">
                    <div className="outline-none" ref={elementRef} tabIndex={-1}>
                        {showMessagesError ? (
                            <ConversationErrorBanner errors={conversationState?.errors} onRetry={handleRetry} />
                        ) : null}
                        {showTrashWarning && (
                            <TrashWarning
                                ref={trashWarningRef}
                                inTrash={inTrash}
                                filter={filter}
                                onToggle={toggleFilter}
                            />
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
                                breakpoints={breakpoints}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                hasFocus={index === focusIndex}
                                onMessageReady={onMessageReady}
                                columnLayout={columnLayout}
                                isComposerOpened={isComposerOpened}
                                containerRef={containerRef}
                                wrapperRef={wrapperRef}
                            />
                        ))}
                    </div>
                </div>
                <UnreadMessages
                    conversationID={conversationID}
                    messages={conversationState?.Messages}
                    onClick={handleClickUnread}
                />
            </Scroll>
        </>
    );
};

export default memo(ConversationView);
