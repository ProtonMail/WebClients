import type { FocusEvent, FocusEventHandler, Ref, RefObject } from 'react';
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type { Breakpoints } from '@proton/components';
import { FeatureCode, useFeature, useKeyTransparencyContext } from '@proton/components';
import createScrollIntoView from '@proton/components/helpers/createScrollIntoView';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { hasAttachments, isDraft, isOutbox, isScheduled, isSent } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { LOAD_RETRY_COUNT } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { isUnread } from '../../helpers/elements';
import type { MessageViewIcons } from '../../helpers/message/icon';
import { getReceivedStatusIcon, getSentStatusIconInfo } from '../../helpers/message/icon';
import { isElementReminded } from '../../helpers/snooze';
import { useMarkAs } from '../../hooks/actions/markAs/useMarkAs';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { useQuickReplyFocus } from '../../hooks/composer/useQuickReplyFocus';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../../hooks/message/useLoadImages';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useMessage } from '../../hooks/message/useMessage';
import { useMessageHotkeys } from '../../hooks/message/useMessageHotkeys';
import { useResignContact } from '../../hooks/message/useResignContact';
import { useVerifyMessage } from '../../hooks/message/useVerifyMessage';
import type { Element } from '../../models/element';
import type { MessageWithOptionalBody } from '../../store/messages/messagesTypes';
import QuickReplyContainer from '../composer/quickReply/QuickReplyContainer';
import MessageBody from './MessageBody';
import MessageFooter from './MessageFooter';
import HeaderCollapsed from './header/HeaderCollapsed';
import HeaderExpanded from './header/HeaderExpanded';

import './MessageView.scss';

interface Props {
    labelID: string;
    conversationMode: boolean;
    loading: boolean;
    labels: Label[];
    message: MessageWithOptionalBody;
    mailSettings: MailSettings;
    conversationIndex?: number;
    conversationID?: string;
    onBack: () => void;
    breakpoints: Breakpoints;
    hasFocus?: boolean;
    onFocus?: (messageId: number) => void;
    onBlur?: (event: FocusEvent<HTMLElement>, messageRef: RefObject<HTMLElement>) => void;
    onMessageReady?: () => void;
    columnLayout?: boolean;
    isComposerOpened: boolean;
    containerRef?: React.RefObject<HTMLElement>;
    wrapperRef?: React.RefObject<HTMLDivElement>;
    onOpenQuickReply?: (index?: number) => void;
    onReadMessage?: (messageID?: string) => void;
}

export interface MessageViewRef {
    expand: () => void;
}

const OFFSET_PERCENTAGE = 0.05; // 5%

const MessageView = (
    {
        labelID,
        conversationMode,
        loading,
        labels = [],
        message: inputMessage,
        mailSettings,
        conversationIndex = 0,
        conversationID,
        onBack,
        breakpoints,
        hasFocus,
        onFocus = noop,
        onBlur = noop,
        onMessageReady,
        columnLayout = false,
        isComposerOpened,
        containerRef,
        wrapperRef,
        onOpenQuickReply,
        onReadMessage,
    }: Props,
    ref: Ref<MessageViewRef>
) => {
    const { feature: quickReplyFeature } = useFeature(FeatureCode.QuickReply);
    const getInitialExpand = () => !conversationMode && !isDraft(inputMessage) && !isOutbox(inputMessage);

    // Actual expanded state
    const [expanded, setExpanded] = useState(getInitialExpand);

    // Show or not the blockquote content
    const [originalMessageMode, setOriginalMessageMode] = useState(false);

    // HTML source should be shown instead of normal rendered content
    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const { ktActivation } = useKeyTransparencyContext();

    const { message, messageLoaded, bodyLoaded } = useMessage(inputMessage.ID, conversationID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage();
    const verify = useVerifyMessage(message.localID);
    const loadRemoteImages = useLoadRemoteImages(message.localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(message.localID);
    const resignContact = useResignContact(message.localID);
    const { markAs } = useMarkAs();

    const onCompose = useOnCompose();

    const draft = !loading && isDraft(message.data);
    const outbox = !loading && (isOutbox(message.data) || message.draftFlags?.sending);
    const sent = isSent(message.data);
    const unread = isUnread(message.data, labelID);
    // It can be attachments but not yet loaded
    const showFooter = hasAttachments(message.data) && Array.isArray(message.data?.Attachments);

    const messageViewIcons = useMemo<MessageViewIcons>(() => {
        if (sent) {
            return getSentStatusIconInfo(message);
        }
        // else it's a received message
        return {
            globalIcon: getReceivedStatusIcon(message.data, message.verification, ktActivation),
            mapStatusIcon: {},
        };
    }, [message, ktActivation]);

    const handleLoadRemoteImages = async () => {
        await loadRemoteImages();
    };

    const handleResignContact = async () => {
        await resignContact();
    };

    const handleLoadEmbeddedImages = async () => {
        await loadEmbeddedImages();
    };

    const handleToggle = (value: boolean) => () => {
        if (draft && !outbox) {
            onCompose({ type: ComposeTypes.existingDraft, existingDraft: message, fromUndo: false });
            return;
        }

        // Do not allow message expand during sending. Because if the user expands it during this step,
        // he will have a flash due to messageDocument computation after receiving API response
        if (!message.draftFlags?.sending) {
            setExpanded(value);
            if (value) {
                onReadMessage?.(message.data?.ID);
            }
        }
    };

    const toggleOriginalMessage = () => setOriginalMessageMode(!originalMessageMode);

    const setParentBottomPadding = (value: number) => {
        if (!elementRef.current) {
            return;
        }

        const parent = elementRef.current.parentNode as HTMLElement;
        parent.classList.add('pb-custom');
        parent.style.setProperty('--padding-bottom-custom', `${value}px`);
    };

    const resetParentBottomPadding = () => {
        setParentBottomPadding(0);
    };

    const scrollToMessage = () => {
        if (!elementRef.current || !containerRef?.current || !wrapperRef?.current) {
            return;
        }

        resetParentBottomPadding();

        const { offsetHeight: containerHeight } = containerRef.current;

        const offset = containerHeight * OFFSET_PERCENTAGE;

        // If the message is already in the offset area of the container,
        // Or is in message only view
        // Or is focusing the first item of a conversation
        // Then abort the scroll
        if (
            elementRef.current.offsetTop - offset < containerRef.current.scrollTop ||
            !conversationMode ||
            (conversationMode && conversationIndex === 0)
        ) {
            return;
        }

        createScrollIntoView(elementRef.current, containerRef.current, false, offset);
    };

    // Setup ref to allow opening the message from outside, typically the ConversationView
    useImperativeHandle(ref, () => ({
        expand: () => {
            // Should be prevented before, but as an extra security...
            if (!isDraft(message.data)) {
                setExpanded(true);
                onReadMessage?.(message.data?.ID);
            }
        },
    }));

    const { hasFocus: hasQuickReplyFocus, setHasFocus: setHasQuickReplyFocus } = useQuickReplyFocus();

    // 1- If on conversation mode
    //      If we click inside another message body (which is an iframe), we will change the hasFocus in that case, the conversation is not focused.
    //      Else, if focused conversation is the one of the quick reply, the focused is managed by hasQuickReplyFocus
    // 2- If on message mode, we only rely on the hasQuickReplyFocus
    const quickReplyIsFocused = hasFocus !== undefined ? hasQuickReplyFocus && hasFocus : hasQuickReplyFocus;

    const canShowQuickReply =
        quickReplyFeature?.Value &&
        !isDraft(message.data) &&
        !isScheduled(message.data) &&
        !isOutbox(message.data) &&
        !isUnread(message.data, labelID);

    // Manage loading the message
    useEffect(() => {
        if (
            !loading &&
            !messageLoaded &&
            /**
             * Draft content is not displayed, metadata is enough
             * So we don't load draft message if we are in the drafts folder
             * Composer will load it if we open it
             */
            labelID !== MAILBOX_LABEL_IDS.DRAFTS &&
            labelID !== MAILBOX_LABEL_IDS.ALL_DRAFTS
        ) {
            void load();
        }

        if (!isComposerOpened && isDraft(message.data) && messageLoaded) {
            // unblock J/K shortcuts
            if (onMessageReady) {
                setTimeout(onMessageReady);
            }
            if (!columnLayout) {
                elementRef.current?.parentElement?.focus();
            }
        }
    }, [loading, messageLoaded, bodyLoaded, message.data?.ID]);

    // Manage preparing the content of the message
    useEffect(() => {
        if (!loading && expanded && message.messageDocument?.initialized === undefined) {
            if ((message.loadRetry || 0) > LOAD_RETRY_COUNT) {
                // Max retries reach, aborting
                return;
            }

            void initialize(message.localID, labelID);
        }
    }, [loading, expanded, message.messageDocument?.initialized, message.localID, labelID]);

    // Manage recomputing signature verification (happens when invalidated after initial load)
    useEffect(() => {
        if (
            !loading &&
            expanded &&
            message.messageDocument?.initialized &&
            message.data &&
            message.verification === undefined
        ) {
            void verify(
                message.decryption?.decryptedRawContent,
                message.decryption?.signature,
                message.errors?.decryption
            );
        }
    }, [loading, expanded, message.messageDocument?.initialized, message.verification]);

    useEffect(() => {
        if (expanded) {
            scrollToMessage();
        }
    }, [expanded]);

    /**
     * Two cases here,
     *     If the message is unread: mark as read a message already loaded (when user marked as unread)
     *     If the message is read: mark message or conversation as read again if DisplaySnoozedReminder present (snooze feature)
     */
    useEffect(() => {
        const element = message.data as Element;
        if (expanded && unread && bodyLoaded) {
            void markAs({
                elements: [element],
                labelID,
                status: MARK_AS_STATUS.READ,
            });
        }

        // Mark the message as read again when DisplaySnoozedReminder is true (snooze feature)
        const isReminded = isElementReminded(element);
        if (!unread && isReminded && !conversationMode) {
            void markAs({
                elements: [element],
                labelID,
                status: MARK_AS_STATUS.READ,
            });
        }
    }, [expanded, unread, bodyLoaded]);

    // Re-initialize context if message is changed without disposing the component
    useEffect(() => {
        if (message.data?.ID) {
            setExpanded(getInitialExpand);
            setSourceMode(false);
            setOriginalMessageMode(false);
        }
    }, [message.data?.ID]);

    /**
     * When message pass from sending to draft (for ex when undo send)
     * we need to go back to non expanded state
     */
    useEffect(() => {
        if (draft === true) {
            setExpanded(false);
        }
    }, [draft]);

    // Automatically activate source mode when processing errors
    const hasProcessingErrors = !!message.errors?.processing?.length;
    useEffect(() => {
        if (hasProcessingErrors) {
            setSourceMode(true);
        }
    }, [hasProcessingErrors]);

    const {
        labelDropdownToggleRef,
        moveDropdownToggleRef,
        filterDropdownToggleRef,
        moveScheduledModal,
        moveSnoozedModal,
        moveToSpamModal,
    } = useMessageHotkeys(
        elementRef,
        {
            labelID,
            conversationIndex,
            message,
            bodyLoaded,
            expanded,
            messageLoaded,
            draft,
            conversationMode,
            mailSettings,
            messageRef: elementRef,
        },
        {
            hasFocus: !!hasFocus,
            setExpanded,
            toggleOriginalMessage,
            handleLoadRemoteImages,
            handleLoadEmbeddedImages,
            onBack,
        }
    );

    function handleFocus(context: 'IFRAME'): () => void;
    function handleFocus(context: 'BUBBLED_EVENT'): (event: FocusEvent) => void;
    function handleFocus(context: 'IFRAME' | 'BUBBLED_EVENT') {
        if (context === 'IFRAME') {
            return () => {
                onFocus(conversationIndex);
                setHasQuickReplyFocus(false);
            };
        }

        if (context === 'BUBBLED_EVENT') {
            return (event: FocusEvent) => {
                // We ensure that the clicked element is in the message view
                // The event can be returned by a bubbled event from a modal
                if (elementRef.current?.contains(event.target)) {
                    onFocus(conversationIndex);
                }
            };
        }
    }

    const handleBlur: FocusEventHandler<HTMLElement> = (event) => {
        onBlur(event, elementRef);
    };

    return (
        <article
            ref={elementRef}
            className={clsx([
                'message-container mx-2 my-4 relative',
                expanded && 'is-opened',
                showFooter && 'has-attachments',
                unread && 'is-unread',
            ])}
            style={{ '--index': conversationIndex * 2 }}
            data-testid={`message-view-${conversationIndex}`}
            tabIndex={0}
            data-message-id={message.data?.ID}
            data-shortcut-target="message-container"
            onFocus={handleFocus('BUBBLED_EVENT')}
            onBlur={handleBlur}
            data-hasfocus={hasFocus}
            data-expanded={expanded}
        >
            {expanded ? (
                <>
                    <HeaderExpanded
                        labelID={labelID}
                        message={message}
                        messageViewIcons={messageViewIcons}
                        messageLoaded={messageLoaded}
                        bodyLoaded={bodyLoaded}
                        isSentMessage={sent}
                        sourceMode={sourceMode}
                        onLoadRemoteImages={handleLoadRemoteImages}
                        onLoadEmbeddedImages={handleLoadEmbeddedImages}
                        onResignContact={handleResignContact}
                        labels={labels}
                        mailSettings={mailSettings}
                        onToggle={handleToggle(false)}
                        onBack={onBack}
                        onSourceMode={setSourceMode}
                        breakpoints={breakpoints}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        filterDropdownToggleRef={filterDropdownToggleRef}
                        parentMessageRef={elementRef}
                        conversationIndex={conversationIndex}
                    />
                    <MessageBody
                        labelID={labelID}
                        messageLoaded={messageLoaded}
                        bodyLoaded={bodyLoaded}
                        sourceMode={sourceMode}
                        message={message}
                        originalMessageMode={originalMessageMode}
                        toggleOriginalMessage={toggleOriginalMessage}
                        onMessageReady={onMessageReady}
                        onFocusIframe={handleFocus('IFRAME')}
                        hasQuickReply={canShowQuickReply}
                    />
                    {showFooter ? <MessageFooter message={message} /> : null}
                    {canShowQuickReply && (
                        <QuickReplyContainer
                            referenceMessageID={message.data?.ID || ''}
                            conversationID={conversationID}
                            conversationIndex={conversationIndex}
                            onOpenQuickReply={onOpenQuickReply}
                            onFocus={handleFocus('IFRAME')}
                            hasFocus={quickReplyIsFocused}
                            setHasFocus={setHasQuickReplyFocus}
                        />
                    )}
                </>
            ) : (
                <HeaderCollapsed
                    labelID={labelID}
                    labels={labels}
                    message={message}
                    messageLoaded={messageLoaded}
                    isSentMessage={sent}
                    isUnreadMessage={unread}
                    onExpand={handleToggle(true)}
                    breakpoints={breakpoints}
                    conversationIndex={conversationIndex}
                />
            )}
            {moveScheduledModal}
            {moveSnoozedModal}
            {moveToSpamModal}
        </article>
    );
};

export default memo(forwardRef(MessageView));
