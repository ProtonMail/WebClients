import {
    useEffect,
    useMemo,
    useRef,
    useState,
    memo,
    forwardRef,
    Ref,
    useImperativeHandle,
    FocusEventHandler,
    RefObject,
    FocusEvent,
} from 'react';
import { hasAttachments, isDraft, isSent, isOutbox } from '@proton/shared/lib/mail/messages';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { classnames } from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { noop } from '@proton/shared/lib/helpers/function';
import createScrollIntoView from '@proton/components/helpers/createScrollIntoView';
import { getSentStatusIconInfo, getReceivedStatusIcon, MessageViewIcons } from '../../helpers/message/icon';
import MessageBody from './MessageBody';
import HeaderCollapsed from './header/HeaderCollapsed';
import HeaderExpanded from './header/HeaderExpanded';
import MessageFooter from './MessageFooter';
import { Element } from '../../models/element';
import { useMessage } from '../../hooks/message/useMessage';
import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { isUnread } from '../../helpers/elements';
import { Breakpoints } from '../../models/utils';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../../hooks/message/useLoadImages';
import { useResignContact } from '../../hooks/message/useResignContact';
import { useVerifyMessage } from '../../hooks/message/useVerifyMessage';
import { useMessageHotkeys } from '../../hooks/message/useMessageHotkeys';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isMessageForwarded } from '../../helpers/encryptedSearch/esBuild';
import { useOnCompose } from '../../containers/ComposeProvider';
import { LOAD_RETRY_COUNT } from '../../constants';

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

    // Show or not the blockquote content, show by default in case of
    // a forwarded message which is the result of an encrypted search
    const { isSearchResult } = useEncryptedSearchContext();
    const defaultOriginalMessageMode = isSearchResult(inputMessage.ID) && isMessageForwarded(inputMessage.Subject);
    const [originalMessageMode, setOriginalMessageMode] = useState(defaultOriginalMessageMode);

    // HTML source should be shown instead of normal rendered content
    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const { message, messageLoaded, bodyLoaded } = useMessage(inputMessage.ID, conversationID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage(message.localID, labelID);
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
                if (!columnLayout) {
                    elementRef.current?.parentElement?.focus();
                }
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

            void initialize();
        }
    }, [loading, expanded, message.messageDocument?.initialized]);

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
            setOriginalMessageMode(defaultOriginalMessageMode);
        }
    }, [message.data?.ID]);

    // Automatically activate source mode when processing errors
    const hasProcessingErrors = !!message.errors?.processing?.length;
    useEffect(() => {
        if (hasProcessingErrors) {
            setSourceMode(true);
        }
    }, [hasProcessingErrors]);

    const { labelDropdownToggleRef, moveDropdownToggleRef, filterDropdownToggleRef } = useMessageHotkeys(
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

    const handleFocus = () => {
        onFocus(conversationIndex);
    };

    const handleBlur: FocusEventHandler<HTMLElement> = (event) => {
        onBlur(event, elementRef);
    };

    return (
        <article
            ref={elementRef}
            className={classnames([
                'message-container m0-5 mb1 outline-none relative',
                expanded && 'is-opened',
                hasFocus && 'is-focused',
                showFooter && 'has-attachments',
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
                        onFocusIframe={handleFocus}
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
        </article>
    );
};

export default memo(forwardRef(MessageView));
