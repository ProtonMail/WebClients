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
import { OnCompose } from '../../containers/ComposerContainer';
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

interface Props {
    labelID: string;
    labels: Label[];
    message: Message;
    mailSettings: any;
    initialExpand?: boolean;
    conversationIndex?: number;
    onBack: () => void;
    onCompose: OnCompose;
}

const MessageView = ({
    labelID,
    labels = [],
    message: inputMessage,
    mailSettings,
    initialExpand: inputInitialExpand = true,
    conversationIndex = 0,
    onBack,
    onCompose
}: Props) => {
    const draft = isDraft(inputMessage);

    const [expanded, setExpanded] = useState(inputInitialExpand && !draft);
    const [initialExpand, setInitialExpand] = useState(inputInitialExpand && !draft);

    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const localID = inputMessage.ID || '';

    const { message, addAction } = useMessage(localID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage(localID);
    const trustSigningPublicKey = useTrustSigningPublicKey(localID);
    const trustAttachedPublicKey = useTrustAttachedPublicKey(localID);
    const loadRemoteImages = useLoadRemoteImages(localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(localID);
    const markAsRead = useMarkAsRead(localID);
    const resignContact = useResignContact(localID);

    const messageLoaded = !!message.data?.Subject;
    const bodyLoaded = !!message.initialized;
    const sent = isSent(message.data);
    const unread = isUnread(message.data, labelID);

    const messageViewIcons = useMemo<MessageViewIcons>(() => {
        if (sent) {
            return getSentStatusIconInfo(message);
        }
        // else it's a received message
        return { globalIcon: getReceivedStatusIcon(message), mapStatusIcon: {} };
    }, [message]);

    const prepareMessage = async () => {
        if (typeof message?.initialized === 'undefined') {
            await addAction(initialize);
        }

        // Don't scroll if it's the first message of the conversation and only on the first automatic expand
        if (conversationIndex !== 0 && initialExpand) {
            elementRef.current && elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        if (!messageLoaded) {
            addAction(load);
        }

        if (messageLoaded && !draft && initialExpand) {
            setExpanded(true);
            setInitialExpand(false);
        }

        if (!draft && !bodyLoaded && expanded) {
            prepareMessage();
        }

        // This particular combination can appear when a message is loaded then marked as unread
        if (!draft && bodyLoaded && unread && expanded) {
            addAction(markAsRead);
        }
    }, [draft, messageLoaded, bodyLoaded, expanded, message.data?.ID]);

    // Re-initialize context if message is changed without disposing the component
    useEffect(() => {
        setExpanded(inputInitialExpand && !draft);
        setInitialExpand(inputInitialExpand && !draft);
        setSourceMode(false);
    }, [message.data?.ID]);

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
        <article ref={elementRef} className={classnames(['message-container m0-5 mb1', expanded && 'is-opened'])}>
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
                            {sourceMode ? (
                                <pre className="ml1 mr1">{message.decryptedBody}</pre>
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
