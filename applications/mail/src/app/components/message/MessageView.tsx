import React, { useEffect, useMemo, useRef, useState, memo, forwardRef, Ref, useImperativeHandle } from 'react';
import { hasAttachments, isDraft, isSent, isOutbox } from 'proton-shared/lib/mail/messages';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { noop } from 'proton-shared/lib/helpers/function';
import createScrollIntoView from 'react-components/helpers/createScrollIntoView';
import { getSentStatusIconInfo, getReceivedStatusIcon, MessageViewIcons } from '../../helpers/message/icon';
import MessageBody from './MessageBody';
import HeaderCollapsed from './header/HeaderCollapsed';
import HeaderExpanded from './header/HeaderExpanded';
import MessageFooter from './MessageFooter';
import { Element } from '../../models/element';
import { useMessage } from '../../hooks/message/useMessage';
import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { isUnread } from '../../helpers/elements';
import { OnCompose } from '../../hooks/composer/useCompose';
import { Breakpoints } from '../../models/utils';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../../hooks/message/useLoadImages';
import { useResignContact } from '../../hooks/message/useResignContact';
import { useVerifyMessage } from '../../hooks/message/useVerifyMessage';
import { useMessageHotkeys } from '../../hooks/message/useMessageHotkeys';

import './MessageView.scss';

interface Props {
    labelID: string;
    conversationMode: boolean;
    loading: boolean;
    labels: Label[];
    message: Message;
    mailSettings: MailSettings;
    conversationIndex?: number;
    conversationID?: string;
    onBack: () => void;
    onCompose: OnCompose;
    breakpoints: Breakpoints;
    onFocus?: (index: number) => void;
    onMessageReady?: () => void;
    columnLayout?: boolean;
    isComposerOpened: boolean;
    containerRef?: React.RefObject<HTMLElement>;
    wrapperRef?: React.RefObject<HTMLDivElement>;
}

export interface MessageViewRef {
    expand: () => void;
}

const OFFSET_PERCENTAGE = 0.25; // 25%

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
        onCompose,
        breakpoints,
        onFocus = noop,
        onMessageReady,
        columnLayout = false,
        isComposerOpened,
        containerRef,
        wrapperRef,
    }: Props,
    ref: Ref<MessageViewRef>
) => {
    const getInitialExpand = () => !conversationMode && !isDraft(inputMessage) && !isOutbox(inputMessage);

    // Actual expanded state
    const [expanded, setExpanded] = useState(getInitialExpand);

    // Show or not the blockquote content
    const [originalMessageMode, setOriginalMessageMode] = useState(false);

    // HTML source should be shown instead of normal rendered content
    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const { message, addAction, messageLoaded, bodyLoaded } = useMessage(inputMessage.ID, conversationID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage(message.localID, labelID);
    const verify = useVerifyMessage(message.localID);
    const loadRemoteImages = useLoadRemoteImages(message.localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(message.localID);
    const resignContact = useResignContact(message.localID);
    const markAs = useMarkAs();

    const draft = !loading && isDraft(message.data);
    const outbox = !loading && (isOutbox(message.data) || message.sending);
    const sent = isSent(message.data);
    const unread = isUnread(message.data, labelID);
    // It can be attachments but not yet loaded
    const showFooter = hasAttachments(message.data) && Array.isArray(message.data?.Attachments);

    const messageViewIcons = useMemo<MessageViewIcons>(() => {
        if (sent) {
            return getSentStatusIconInfo(message);
        }
        // else it's a received message
        return { globalIcon: getReceivedStatusIcon(message.data, message.verification), mapStatusIcon: {} };
    }, [message]);

    const handleLoadRemoteImages = async () => {
        await addAction(loadRemoteImages);
    };

    const handleResignContact = async () => {
        await addAction(resignContact);
    };

    const handleLoadEmbeddedImages = async () => {
        await addAction(loadEmbeddedImages);
    };

    const handleToggle = (value: boolean) => () => {
        if (draft && !outbox) {
            onCompose({ existingDraft: message, fromUndo: false });
            return;
        }

        setExpanded(value);
    };

    const toggleOriginalMessage = () => setOriginalMessageMode(!originalMessageMode);

    const setParentBottomPadding = (value: number) => {
        if (!elementRef.current) {
            return;
        }

        const parent = elementRef.current.parentNode as HTMLElement;
        parent.style.paddingBottom = `${value}px`;
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

        const header = containerRef.current.firstChild as HTMLElement;
        const { offsetHeight: headerHeight } = header;

        const offset = (containerHeight - headerHeight) * OFFSET_PERCENTAGE;
        const totalOffset = headerHeight + offset;

        // if the message is already in the offset area of the container, abort the scroll
        if (elementRef.current.offsetTop - totalOffset < containerRef.current.scrollTop) {
            return;
        }

        /* @todo refine padding bottom calculation */
        const wrapperPaddingBottom = parseInt(getComputedStyle(wrapperRef.current).paddingBottom, 10);
        const wrapperPaddingTop = parseInt(getComputedStyle(wrapperRef.current).paddingTop, 10);

        setParentBottomPadding(
            Math.max(
                containerHeight -
                    totalOffset -
                    elementRef.current.offsetHeight +
                    wrapperPaddingBottom +
                    wrapperPaddingTop,
                0
            )
        );
        createScrollIntoView(elementRef.current, containerRef.current, false, totalOffset);
    };

    // Setup ref to allow opening the message from outside, typically the ConversationView
    useImperativeHandle(ref, () => ({
        expand: () => {
            // Should be prevented before, but as an extra security...
            if (!isDraft(message.data)) {
                setExpanded(true);
                if (!columnLayout) {
                    elementRef.current?.focus();
                }
            }
        },
    }));

    // Manage loading the message
    useEffect(() => {
        if (!loading && !messageLoaded) {
            void addAction(load);
        }

        if (!isComposerOpened && isDraft(message.data) && messageLoaded) {
            // unblock J/K shortcuts
            if (onMessageReady) {
                setTimeout(onMessageReady);
            }
            elementRef.current?.focus();
        }
    }, [loading, messageLoaded, message.data?.ID]);

    // Manage preparing the content of the message
    useEffect(() => {
        if (!loading && expanded && message.initialized === undefined) {
            void addAction(initialize);
        }
    }, [loading, expanded, message.initialized]);

    // Manage recomputing signature verification (happens when invalidated after initial load)
    useEffect(() => {
        if (!loading && expanded && message.initialized && message.verification === undefined) {
            void addAction(() => verify(message.decryptedRawContent as string, message.signature));
        }
    }, [loading, expanded, message.initialized, message.verification]);

    useEffect(() => {
        if (expanded) {
            scrollToMessage();
        }
    }, [expanded]);

    // Mark as read a message already loaded (when user marked as unread)
    useEffect(() => {
        if (expanded && unread && bodyLoaded && !message.actionInProgress) {
            markAs([message.data as Element], labelID, MARK_AS_STATUS.READ);
        }
    }, [expanded, unread, bodyLoaded, message.actionInProgress]);

    // Re-initialize context if message is changed without disposing the component
    useEffect(() => {
        if (message.data?.ID) {
            setExpanded(getInitialExpand);
            setSourceMode(false);
        }
    }, [draft, message.data?.ID]);

    // Automatically activate source mode when processing errors
    const hasProcessingErrors = !!message.errors?.processing?.length;
    useEffect(() => {
        if (hasProcessingErrors) {
            setSourceMode(true);
        }
    }, [hasProcessingErrors]);

    const {
        hasFocus,
        handleFocus,
        handleBlur,
        labelDropdownToggleRef,
        moveDropdownToggleRef,
        filterDropdownToggleRef,
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
        },
        {
            onFocus,
            onCompose,
            setExpanded,
            toggleOriginalMessage,
            handleLoadRemoteImages,
            handleLoadEmbeddedImages,
        }
    );

    return (
        <article
            ref={elementRef}
            className={classnames([
                'message-container m0-5 mb1 no-outline',
                expanded && 'is-opened',
                hasAttachments(message.data) && 'message-container--hasAttachment',
                hasFocus && 'is-focused',
            ])}
            style={{ '--index': conversationIndex * 2 }}
            data-testid="message-view"
            tabIndex={-1}
            data-message-id={message.data?.ID}
            data-shortcut-target="message-container"
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            {expanded ? (
                <>
                    <HeaderExpanded
                        labelID={labelID}
                        conversationMode={conversationMode}
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
                        onCompose={onCompose}
                        onSourceMode={setSourceMode}
                        breakpoints={breakpoints}
                        labelDropdownToggleRef={labelDropdownToggleRef}
                        moveDropdownToggleRef={moveDropdownToggleRef}
                        filterDropdownToggleRef={filterDropdownToggleRef}
                    />
                    <MessageBody
                        messageLoaded={messageLoaded}
                        bodyLoaded={bodyLoaded}
                        sourceMode={sourceMode}
                        message={message}
                        originalMessageMode={originalMessageMode}
                        toggleOriginalMessage={toggleOriginalMessage}
                        onMessageReady={onMessageReady}
                    />
                    {showFooter ? <MessageFooter message={message} /> : null}
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
                    onCompose={onCompose}
                    breakpoints={breakpoints}
                />
            )}
        </article>
    );
};

export default memo(forwardRef(MessageView));
