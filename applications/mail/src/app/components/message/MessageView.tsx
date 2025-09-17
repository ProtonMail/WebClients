import type { FocusEvent, FocusEventHandler, Ref, RefObject } from 'react';
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { useKeyTransparencyContext } from '@proton/components';
import createScrollIntoView from '@proton/components/helpers/createScrollIntoView';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { hasAttachments, isDraft, isOutbox, isSent } from '@proton/shared/lib/mail/messages';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { LOAD_RETRY_COUNT } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { hasLabel, isUnread } from '../../helpers/elements';
import type { MessageViewIcons } from '../../helpers/message/icon';
import { getReceivedStatusIcon, getSentStatusIconInfo } from '../../helpers/message/icon';
import { isElementReminded } from '../../helpers/snooze';
import { useMarkAs } from '../../hooks/actions/markAs/useMarkAs';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../../hooks/message/useLoadImages';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useMessage } from '../../hooks/message/useMessage';
import { useMessageHotkeys } from '../../hooks/message/useMessageHotkeys';
import { useResignContact } from '../../hooks/message/useResignContact';
import { useVerifyMessage } from '../../hooks/message/useVerifyMessage';
import { useMailECRTMetric } from '../../metrics/useMailECRTMetric';
import type { Element } from '../../models/element';
import { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';
import MessageBody from './MessageBody';
import MessageFooter from './extrasFooter/MessageFooter';
import HeaderCollapsed from './extrasHeader/HeaderCollapsed';
import HeaderExpanded from './extrasHeader/HeaderExpanded';

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
    hasFocus?: boolean;
    onFocus?: (messageId: number) => void;
    onBlur?: (event: FocusEvent<HTMLElement>, messageRef: RefObject<HTMLElement>) => void;
    onMessageReady?: () => void;
    columnLayout?: boolean;
    isComposerOpened: boolean;
    containerRef?: React.RefObject<HTMLElement>;
    wrapperRef?: React.RefObject<HTMLDivElement>;
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
        hasFocus,
        onFocus = noop,
        onBlur = noop,
        onMessageReady,
        columnLayout = false,
        isComposerOpened,
        containerRef,
        wrapperRef,
        onReadMessage,
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

    const { stopECRTMetric } = useMailECRTMetric();

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

    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');

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
        const isInDeletedFolder = isRetentionPoliciesEnabled && hasLabel(message.data, MAILBOX_LABEL_IDS.SOFT_DELETED);
        if (draft && !outbox && !isInDeletedFolder) {
            void onCompose({ type: ComposeTypes.existingDraft, existingDraft: message, fromUndo: false });
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
                sourceAction: SOURCE_ACTION.MESSAGE_VIEW,
                silent: true,
            });
        }

        // Mark the message as read again when DisplaySnoozedReminder is true (snooze feature)
        const isReminded = isElementReminded(element);
        if (!unread && isReminded && !conversationMode) {
            void markAs({
                elements: [element],
                labelID,
                status: MARK_AS_STATUS.READ,
                sourceAction: SOURCE_ACTION.MESSAGE_VIEW,
                silent: true,
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
                        onIframeReady={() => {
                            // The sent folder doesn't behave as other folders.
                            // The inidividual message are displayed and not the conversation.
                            // Regardless the conversation groupping setting.
                            if (labelID === MAILBOX_LABEL_IDS.ALL_SENT) {
                                stopECRTMetric(message.data?.ID);
                            } else {
                                stopECRTMetric(conversationMode ? message.data?.ConversationID : message.data?.ID);
                            }
                        }}
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
