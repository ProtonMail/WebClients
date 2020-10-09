import { OpenPGPKey } from 'pmcrypto';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { hasAttachments, isDraft, isSent } from 'proton-shared/lib/mail/messages';
import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';

import { getSentStatusIconInfo, getReceivedStatusIcon, MessageViewIcons } from '../../helpers/message/icon';
import MessageBody from './MessageBody';
import HeaderCollapsed from './header/HeaderCollapsed';
import HeaderExpanded from './header/HeaderExpanded';
import MessageFooter from './MessageFooter';
import { Element } from '../../models/element';
import { useMessage } from '../../hooks/message/useMessage';
import { useMarkAs, MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { isUnread } from '../../helpers/elements';
import { OnCompose } from '../../hooks/useCompose';
import { Breakpoints } from '../../models/utils';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useInitializeMessage } from '../../hooks/message/useInitializeMessage';
import { useTrustAttachedPublicKey, useTrustSigningPublicKey } from '../../hooks/message/useTrustPublicKey';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../../hooks/message/useLoadImages';
import { useResignContact } from '../../hooks/message/useResignContact';

interface Props {
    labelID: string;
    conversationMode: boolean;
    loading: boolean;
    labels: Label[];
    message: Message;
    mailSettings: any;
    expand?: boolean;
    conversationIndex?: number;
    conversationID?: string;
    onBack: () => void;
    onCompose: OnCompose;
    breakpoints: Breakpoints;
}

const MessageView = ({
    labelID,
    conversationMode,
    loading,
    labels = [],
    message: inputMessage,
    mailSettings,
    expand: inputExpand = true,
    conversationIndex = 0,
    conversationID,
    onBack,
    onCompose,
    breakpoints
}: Props) => {
    const inputMessageIsDraft = !loading && isDraft(inputMessage);

    // Actual expanded state
    const [expanded, setExpanded] = useState(inputExpand && !inputMessageIsDraft);

    // Whether or not the focus has already been made
    const [hasBeenFocused, setHasBeenFocused] = useState(false);

    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const { message, addAction, messageLoaded, bodyLoaded } = useMessage(inputMessage.ID, conversationID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage(message.localID, labelID);
    const trustSigningPublicKey = useTrustSigningPublicKey(message.localID);
    const trustAttachedPublicKey = useTrustAttachedPublicKey(message.localID);
    const loadRemoteImages = useLoadRemoteImages(message.localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(message.localID);
    const resignContact = useResignContact(message.localID);
    const markAs = useMarkAs();

    const draft = !loading && isDraft(message.data);
    const sent = isSent(message.data);
    const unread = isUnread(message.data, labelID);
    // It can be attachments but not yet loaded
    const showFooter = hasAttachments(message.data) && Array.isArray(message.data?.Attachments);

    const messageViewIcons = useMemo<MessageViewIcons>(() => {
        if (sent) {
            return getSentStatusIconInfo(message);
        }
        // else it's a received message
        return { globalIcon: getReceivedStatusIcon(message), mapStatusIcon: {} };
    }, [message]);

    // Manage loading the message
    useEffect(() => {
        if (!loading && !messageLoaded) {
            addAction(load);
        }
    }, [loading, messageLoaded]);

    // Manage preparing the content of the message
    useEffect(() => {
        if (!loading && expanded && message.initialized === undefined) {
            addAction(initialize);
        }
    }, [loading, expanded, message.initialized]);

    // Manage the focus to the message
    useEffect(() => {
        if (!hasBeenFocused && inputExpand && messageLoaded && conversationIndex !== 0) {
            // Let the browser render the content before scrolling
            setTimeout(() => {
                elementRef.current &&
                    elementRef.current.scrollIntoView({ behavior: bodyLoaded ? 'smooth' : 'auto', block: 'start' });
            });
            setHasBeenFocused(bodyLoaded);
        }
    }, [inputExpand, messageLoaded, bodyLoaded, hasBeenFocused, conversationIndex]);

    // Mark as read a message already loaded (when user marked as unread)
    useEffect(() => {
        if (expanded && unread && bodyLoaded && !message.actionInProgress) {
            markAs([message.data as Element], labelID, MARK_AS_STATUS.READ);
        }
    }, [expanded, unread, bodyLoaded, message.actionInProgress]);

    // Re-initialize context if message is changed without disposing the component
    useEffect(() => {
        if (message.data?.ID) {
            setExpanded(inputExpand && !draft);
            setHasBeenFocused(false);
            setSourceMode(false);
        }
    }, [draft, message.data?.ID]);

    // Expand the message if the conversation view ask for it
    useEffect(() => {
        if (inputExpand) {
            setExpanded(inputExpand && !inputMessageIsDraft);
        }
    }, [inputExpand]);

    const handleTrustSigningPublicKey = async (key: OpenPGPKey) => {
        await addAction(() => trustSigningPublicKey(key));
    };

    const handleTrustAttachedPublicKey = async (key: OpenPGPKey) => {
        await addAction(() => trustAttachedPublicKey(key));
    };

    const handleLoadRemoteImages = async () => {
        await addAction(loadRemoteImages);
    };

    const handleResignContact = async () => {
        await addAction(resignContact);
    };

    const handleLoadEmbeddedImages = async () => {
        await addAction(loadEmbeddedImages);
    };

    const handleExpand = (value: boolean) => () => {
        if (draft) {
            onCompose({ existingDraft: message });
        } else {
            setExpanded(value);
        }
    };

    return (
        <article
            ref={elementRef}
            className={classnames([
                'message-container m0-5 mb1',
                expanded && 'is-opened',
                hasAttachments(message.data) && 'message-container--hasAttachment'
            ])}
            style={{ '--index': conversationIndex * 2 }}
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
                        onTrustSigningKey={handleTrustSigningPublicKey}
                        onTrustAttachedKey={handleTrustAttachedPublicKey}
                        onLoadRemoteImages={handleLoadRemoteImages}
                        onLoadEmbeddedImages={handleLoadEmbeddedImages}
                        onResignContact={handleResignContact}
                        labels={labels}
                        mailSettings={mailSettings}
                        onCollapse={handleExpand(false)}
                        onBack={onBack}
                        onCompose={onCompose}
                        onSourceMode={setSourceMode}
                        breakpoints={breakpoints}
                    />
                    <MessageBody
                        messageLoaded={messageLoaded}
                        bodyLoaded={bodyLoaded}
                        sourceMode={sourceMode}
                        message={message}
                    />
                    {showFooter ? <MessageFooter message={message} /> : null}
                </>
            ) : (
                <HeaderCollapsed
                    labelID={labelID}
                    labels={labels}
                    message={message}
                    messageLoaded={messageLoaded}
                    mailSettings={mailSettings}
                    isSentMessage={sent}
                    isUnreadMessage={unread}
                    isDraftMessage={draft}
                    onExpand={handleExpand(true)}
                    onCompose={onCompose}
                />
            )}
        </article>
    );
};

export default memo(MessageView);
