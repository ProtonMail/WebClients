import { RefObject, memo, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { Scroll } from '@proton/atoms';
import { classnames, useLabels, useToggle } from '@proton/components';
import { isEditing } from '@proton/shared/lib/busy';
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
import { useGetMessage } from '../../hooks/message/useMessage';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import useShouldMoveOut from '../../hooks/useShouldMoveOut';
import { removeAllQuickReplyFlags } from '../../logic/messages/draft/messagesDraftActions';
import { Breakpoints } from '../../models/utils';
import MessageView, { MessageViewRef } from '../message/MessageView';
import ConversationErrorBanner from './ConversationErrorBanner';
import ConversationHeader from './ConversationHeader';
import TrashWarning from './TrashWarning';
import UnreadMessages from './UnreadMessages';

const { TRASH, ALL_MAIL } = MAILBOX_LABEL_IDS;

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
    containerRef: RefObject<HTMLElement>;
    loadingElements: boolean;
    elementIDs: string[];
    conversationMode: boolean;
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
    loadingElements,
    elementIDs,
    conversationMode,
}: Props) => {
    const dispatch = useDispatch();
    const getMessage = useGetMessage();
    const { isSearchResult } = useEncryptedSearchContext();
    const [labels = []] = useLabels();
    const {
        conversationID,
        conversation: conversationState,
        loadingConversation,
        loadingMessages,
        handleRetry,
    } = useConversation(inputConversationID, messageID);
    const { state: filter, toggle: toggleFilter, set: setFilter } = useToggle(DEFAULT_FILTER_VALUE);
    useShouldMoveOut({
        elementIDs,
        elementID: conversationMode ? conversationID : messageID,
        loadingElements,
        onBack,
    });
    const messageViewsRefs = useRef({} as { [messageID: string]: MessageViewRef | undefined });

    const wrapperRef = useRef<HTMLDivElement>(null);

    const { Conversation: conversation, Messages: inputMessages = [] } = conversationState || {};
    const messages = usePlaceholders(inputMessages, loadingMessages, conversation?.NumMessages || 1) as Message[];

    const inTrash = labelID === TRASH;
    const inAllMail = labelID === ALL_MAIL;
    const filteredMessages = messages.filter(
        (message) => inAllMail || inTrash === hasLabel(message, TRASH) || isSearchResult(message.ID)
    );

    const messagesToShow = !loadingMessages && filter ? filteredMessages : messages;

    const messagesWithoutQuickReplies = messagesToShow.filter((message) => {
        const messageFromState = getMessage(message.ID);
        return !messageFromState?.draftFlags?.isQuickReply;
    });

    const showTrashWarning = !loadingMessages && filteredMessages.length !== messages.length;
    const messageInUrl = conversationState?.Messages?.find((message) => message.ID === messageID);
    const loading = loadingConversation || loadingMessages;
    const showConversationError = !loading && conversationState?.Conversation?.Subject === undefined;
    const showMessagesError = !loading && !showConversationError && !conversationState?.Messages;

    const { focusIndex, handleFocus, handleScrollToMessage, handleBlur, getFocusedId } =
        useConversationFocus(messagesWithoutQuickReplies);

    const expandMessage = (messageID: string | undefined, scrollTo = false) => {
        messageViewsRefs.current[messageID || '']?.expand();
        const index = messagesToShow.findIndex((message) => message.ID === messageID);
        // isEditing is used to prevent the focus to be set on the message when the user is editing, otherwise it triggers shortcuts
        if (index !== undefined && !isEditing()) {
            handleFocus(index, { scrollTo });
        }
    };

    const { elementRef } = useConversationHotkeys(
        { messages: messagesWithoutQuickReplies, focusIndex },
        { handleFocus, getFocusedId, expandMessage }
    );

    // Open the first message of a conversation if none selected in URL
    useEffect(() => {
        if (!loadingMessages && !messageID) {
            expandMessage(findMessageToExpand(labelID, messagesWithoutQuickReplies)?.ID);
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

    useEffect(() => {
        // When the user is switching conversation we need to remove potential quick replies draft flags
        dispatch(removeAllQuickReplyFlags());
    }, [conversationID]);

    const handleOpenQuickReply = (messageIndex?: number) => {
        handleScrollToMessage(messageIndex, 'end');
    };

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
        <Scroll className={classnames([hidden && 'hidden'])} customContainerRef={containerRef}>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={loadingConversation}
                element={conversation}
            />
            <div ref={wrapperRef} className="flex-item-fluid pr1 pl1 w100">
                <div className="outline-none" ref={elementRef} tabIndex={-1}>
                    {showMessagesError ? (
                        <ConversationErrorBanner errors={conversationState?.errors} onRetry={handleRetry} />
                    ) : null}
                    {showTrashWarning && (
                        <TrashWarning ref={trashWarningRef} inTrash={inTrash} filter={filter} onToggle={toggleFilter} />
                    )}
                    {messagesWithoutQuickReplies.map((message, index) => (
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
                            onOpenQuickReply={handleOpenQuickReply}
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
    );
};

export default memo(ConversationView);
