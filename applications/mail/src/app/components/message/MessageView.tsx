import {
    FocusEvent,
    FocusEventHandler,
    Ref,
    RefObject,
    forwardRef,
    memo,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';

import { classnames } from '@proton/components';
import createScrollIntoView from '@proton/components/helpers/createScrollIntoView';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { hasAttachments, isDraft, isOutbox, isSent } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import { LOAD_RETRY_COUNT } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { isUnread } from '../../helpers/elements';
import { MessageViewIcons, getReceivedStatusIcon, getSentStatusIconInfo } from '../../helpers/message/icon';
import { MARK_AS_STATUS, useMarkAs } from '../../hooks/actions/useMarkAs';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../../hooks/message/useLoadImages';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useMessage } from '../../hooks/message/useMessage';
import { useMessageHotkeys } from '../../hooks/message/useMessageHotkeys';
import { useResignContact } from '../../hooks/message/useResignContact';
import { useVerifyMessage } from '../../hooks/message/useVerifyMessage';
import { MessageWithOptionalBody } from '../../logic/messages/messagesTypes';
import { Element } from '../../models/element';
import { Breakpoints } from '../../models/utils';
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
        breakpoints,
        hasFocus,
        onFocus = noop,
        onBlur = noop,
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

    const { message, messageLoaded, bodyLoaded } = useMessage(inputMessage.ID, conversationID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage();
    const verify = useVerifyMessage(message.localID);
    const loadRemoteImages = useLoadRemoteImages(message.localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(message.localID);
    const resignContact = useResignContact(message.localID);
    const markAs = useMarkAs();

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
        return { globalIcon: getReceivedStatusIcon(message.data, message.verification), mapStatusIcon: {} };
    }, [message]);

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

        // if the message is already in the offset area of the container, abort the scroll
        if (elementRef.current.offsetTop - offset < containerRef.current.scrollTop) {
            return;
        }

        /* @todo refine padding bottom calculation */
        const wrapperPaddingBottom = parseInt(getComputedStyle(wrapperRef.current).paddingBottom, 10);
        const wrapperPaddingTop = parseInt(getComputedStyle(wrapperRef.current).paddingTop, 10);

        setParentBottomPadding(
            Math.max(
                containerHeight - offset - elementRef.current.offsetHeight + wrapperPaddingBottom + wrapperPaddingTop,
                0
            )
        );
        createScrollIntoView(elementRef.current, containerRef.current, false, offset);
    };

    // Setup ref to allow opening the message from outside, typically the ConversationView
    useImperativeHandle(ref, () => ({
        expand: () => {
            // Should be prevented before, but as an extra security...
            if (!isDraft(message.data)) {
                setExpanded(true);
            }
        },
    }));

    // Manage loading the message
    useEffect(() => {
        if (!loading && !messageLoaded) {
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
            void verify(message.decryption?.decryptedRawContent, message.decryption?.signature);
        }
    }, [loading, expanded, message.messageDocument?.initialized, message.verification]);

    useEffect(() => {
        if (expanded) {
            scrollToMessage();
        }
    }, [expanded]);

    // Mark as read a message already loaded (when user marked as unread)
    useEffect(() => {
        if (expanded && unread && bodyLoaded) {
            markAs([message.data as Element], labelID, MARK_AS_STATUS.READ);
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
        moveAllModal,
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
            className={classnames([
                'message-container mx0-5 my1 outline-none relative',
                expanded && 'is-opened',
                hasFocus && 'is-focused',
                showFooter && 'has-attachments',
                unread && 'is-unread',
            ])}
            style={{ '--index': conversationIndex * 2 }}
            data-testid="message-view"
            tabIndex={-1}
            data-message-id={message.data?.ID}
            data-shortcut-target="message-container"
            onFocus={handleFocus('BUBBLED_EVENT')}
            onBlur={handleBlur}
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
                    breakpoints={breakpoints}
                />
            )}
            {moveScheduledModal}
            {moveAllModal}
            {moveToSpamModal}
        </article>
    );
};

export default memo(forwardRef(MessageView));
