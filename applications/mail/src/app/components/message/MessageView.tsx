import { OpenPGPKey } from 'pmcrypto';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader, classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';

import { hasAttachments, isDraft, isSent } from '../../helpers/message/messages';
import { getSentStatusIconInfo, getReceivedStatusIcon, MessageViewIcons } from '../../helpers/message/icon';
import MessageBody from './MessageBody';
import HeaderCollapsed from './header/HeaderCollapsed';
import HeaderExpanded from './header/HeaderExpanded';
import MessageFooter from './MessageFooter';
import { Message } from '../../models/message';
import { useMessage } from '../../hooks/useMessage';
import {
    useInitializeMessage,
    useLoadMessage,
    useLoadRemoteImages,
    useLoadEmbeddedImages,
    useMarkAsRead,
    useTrustSigningPublicKey,
    useResignContact,
    useTrustAttachedPublicKey
} from '../../hooks/useMessageReadActions';
import { isUnread } from '../../helpers/elements';
import { OnCompose } from '../../hooks/useCompose';

interface Props {
    labelID: string;
    labels: Label[];
    message: Message;
    mailSettings: any;
    expand?: boolean;
    conversationIndex?: number;
    onBack: () => void;
    onCompose: OnCompose;
}

const MessageView = ({
    labelID,
    labels = [],
    message: inputMessage,
    mailSettings,
    expand: inputExpand = true,
    conversationIndex = 0,
    onBack,
    onCompose
}: Props) => {
    // Actual expanded state
    const [expanded, setExpanded] = useState(inputExpand && !isDraft(inputMessage));

    // Whether or not the focus has already been made
    const [hasBeenFocused, setHasBeenFocused] = useState(false);

    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const { message, addAction } = useMessage(inputMessage.ID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage(message.localID);
    const trustSigningPublicKey = useTrustSigningPublicKey(message.localID);
    const trustAttachedPublicKey = useTrustAttachedPublicKey(message.localID);
    const loadRemoteImages = useLoadRemoteImages(message.localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(message.localID);
    const markAsRead = useMarkAsRead(message.localID);
    const resignContact = useResignContact(message.localID);

    const draft = isDraft(message.data);
    const messageLoaded = !!message.data?.Subject;
    const bodyLoaded = !!message.initialized;
    const sent = isSent(message.data);
    const unread = isUnread(message.data, labelID);
    const encryptedMode = messageLoaded && message.errors?.decryption;

    const messageViewIcons = useMemo<MessageViewIcons>(() => {
        if (sent) {
            return getSentStatusIconInfo(message);
        }
        // else it's a received message
        return { globalIcon: getReceivedStatusIcon(message), mapStatusIcon: {} };
    }, [message]);

    // Manage loading the message
    useEffect(() => {
        if (!messageLoaded) {
            addAction(load);
        }
    }, [messageLoaded]);

    // Manage preparing the content of the message
    useEffect(() => {
        if (expanded && message.initialized === undefined) {
            addAction(initialize);
        }
    }, [expanded, message.initialized]);

    // Manage the focus to the message
    useEffect(() => {
        if (!hasBeenFocused && inputExpand && bodyLoaded && conversationIndex !== 0) {
            elementRef.current && elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setHasBeenFocused(true);
        }
    }, [inputExpand, bodyLoaded, hasBeenFocused, conversationIndex]);

    // Mark as read a message already loaded (when user marked as unread)
    useEffect(() => {
        if (expanded && unread && bodyLoaded && !message.actionStatus) {
            addAction(markAsRead);
        }
    }, [expanded, unread, bodyLoaded, message.actionStatus]);

    // Re-initialize context if message is changed without disposing the component
    useEffect(() => {
        if (message.data?.ID) {
            setExpanded(inputExpand && !draft);
            setHasBeenFocused(false);
            setSourceMode(false);
        }
    }, [draft, message.data?.ID]);

    if (!messageLoaded) {
        return null;
    }

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
        >
            {expanded ? (
                <>
                    <HeaderExpanded
                        labelID={labelID}
                        message={message}
                        messageViewIcons={messageViewIcons}
                        messageLoaded={bodyLoaded}
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
                    />
                    {bodyLoaded ? (
                        <>
                            {sourceMode || encryptedMode ? (
                                <pre className="ml1 mr1">
                                    {encryptedMode ? message.data?.Body : sourceMode ? message.decryptedBody : null}
                                </pre>
                            ) : (
                                <MessageBody message={message} />
                            )}
                            {hasAttachments(message.data) ? <MessageFooter message={message} /> : null}
                        </>
                    ) : (
                        <Loader />
                    )}
                </>
            ) : (
                <HeaderCollapsed
                    labelID={labelID}
                    message={message}
                    messageViewIcons={messageViewIcons}
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

export default MessageView;
