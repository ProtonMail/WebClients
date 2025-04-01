import type { RefObject } from 'react';
import { memo, useEffect, useRef } from 'react';

import { Scroll } from '@proton/atoms';
import type { Breakpoints } from '@proton/components';
import { useToggle } from '@proton/components';
import { useLabels } from '@proton/mail';
import { isEditing } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { isDraft } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import useUnreadNotifications from 'proton-mail/hooks/useUnreadNotifications';
import { selectComposersCount } from 'proton-mail/store/composers/composerSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { hasLabel } from '../../helpers/elements';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { isElementReminded } from '../../helpers/snooze';
import { useMarkAs } from '../../hooks/actions/markAs/useMarkAs';
import { useConversation } from '../../hooks/conversation/useConversation';
import { useConversationFocus } from '../../hooks/conversation/useConversationFocus';
import { useConversationHotkeys } from '../../hooks/conversation/useConversationHotkeys';
import { useGetMessage } from '../../hooks/message/useMessage';
import { usePlaceholders } from '../../hooks/usePlaceholders';
import { removeAllQuickReplyFlags } from '../../store/messages/draft/messagesDraftActions';
import { SOURCE_ACTION } from '../list/useListTelemetry';
import type { MessageViewRef } from '../message/MessageView';
import MessageView from '../message/MessageView';
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
    const dispatch = useMailDispatch();
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
    const messageViewsRefs = useRef({} as { [messageID: string]: MessageViewRef | undefined });
    const composersCount = useMailSelector(selectComposersCount);

    const wrapperRef = useRef<HTMLDivElement>(null);

    const { Conversation: conversation, Messages: inputMessages = [] } = conversationState || {};
    const messages = usePlaceholders(inputMessages, loadingMessages, conversation?.NumMessages || 1) as Message[];

    const inTrash = labelID === TRASH;
    const inAllMail = labelID === ALL_MAIL;
    const filteredMessages = messages.filter(
        (message) => inAllMail || inTrash === hasLabel(message, TRASH) || isSearchResult(message.ID)
    );

    const messagesToShow = !loadingMessages && filter ? filteredMessages : messages;

    const messagesWithoutQuickReplies = messagesToShow
        .filter((message) => {
            const messageFromState = getMessage(message.ID);
            return !messageFromState?.draftFlags?.isQuickReply;
        })
        .sort((a, b) => a.Time - b.Time);

    // "messagesWithoutQuickReplies" contains filtered messages to display or not in the conversation view.
    // We can use this variable to get unread notifications since trashed or inbox messages (depending on the current location) will be filtered or not.
    const { unreadMessageAfterTimeMarkerIds, handleReadMessage } = useUnreadNotifications(
        messagesWithoutQuickReplies,
        conversationID
    );

    const showTrashWarning = !loadingMessages && filteredMessages.length !== messages.length;
    const messageInUrl = conversationState?.Messages?.find((message) => message.ID === messageID);
    const loading = loadingConversation || loadingMessages;
    const showConversationError = !loading && conversationState?.Conversation?.Subject === undefined;
    const showMessagesError = !loading && !showConversationError && !conversationState?.Messages;
    const { markAs } = useMarkAs();

    const { focusIndex, handleFocus, handleScrollToMessage, handleBlur, getFocusedId } =
        useConversationFocus(messagesWithoutQuickReplies);

    const expandMessage = (messageID: string | undefined, scrollTo = false) => {
        messageViewsRefs.current[messageID || '']?.expand();
        const index = messagesToShow.findIndex((message) => message.ID === messageID);
        // isEditing is used to prevent the focus to be set on the message when the user is editing, otherwise it triggers shortcuts
        // Also, when a composer is opened, we don't want to focus the message when we expand it (e.g. message is being sent),
        // so that the user is able to continue editing
        if (index !== undefined && !isEditing() && composersCount === 0) {
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

    // Mark conversation as read when opened and reminded (snooze feature)
    useEffect(() => {
        const isReminded = isElementReminded(conversation);
        if (isReminded && conversation) {
            void markAs({
                elements: [conversation],
                labelID,
                status: MARK_AS_STATUS.READ,
                sourceAction: SOURCE_ACTION.MESSAGE_VIEW,
            });
        }
    }, [conversation]);

    const handleOpenQuickReply = (messageIndex?: number) => {
        handleScrollToMessage(messageIndex, 'end');
    };

    const handleClickUnreadNotification = (messageID: string) => {
        handleReadMessage(messageID);
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
        <Scroll className={clsx([hidden && 'hidden'])} customContainerRef={containerRef}>
            <ConversationHeader
                className={clsx([hidden && 'hidden'])}
                loading={loadingConversation}
                element={conversation}
            />
            <div ref={wrapperRef} className="flex-1 px-4 w-full">
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
                            onReadMessage={handleReadMessage}
                        />
                    ))}
                </div>
            </div>

            <UnreadMessages messagesIDs={unreadMessageAfterTimeMarkerIds} onClick={handleClickUnreadNotification} />
        </Scroll>
    );
};

export default memo(ConversationView);
