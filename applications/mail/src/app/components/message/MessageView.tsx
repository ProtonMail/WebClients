import React, { useEffect, useRef, useState } from 'react';
import { Loader, classnames } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';

import { hasAttachments, isDraft } from '../../helpers/message/messages';
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
    useMarkAsRead
} from '../../hooks/useMessageReadActions';
import { isUnread } from '../../helpers/elements';

interface Props {
    labels: Label[];
    message: Message;
    mailSettings: any;
    initialExpand?: boolean;
    conversationIndex?: number;
    onBack: () => void;
    onCompose: OnCompose;
}

const MessageView = ({
    labels = [],
    message: inputMessage,
    mailSettings,
    initialExpand = true,
    conversationIndex = 0,
    onBack,
    onCompose
}: Props) => {
    const draft = isDraft(inputMessage);

    const [expanded, setExpanded] = useState(initialExpand && !draft);

    const [sourceMode, setSourceMode] = useState(false);

    const elementRef = useRef<HTMLElement>(null);

    const localID = inputMessage.ID || '';

    const { message, addAction } = useMessage(localID);
    const load = useLoadMessage(inputMessage);
    const initialize = useInitializeMessage(localID);
    const loadRemoteImages = useLoadRemoteImages(localID);
    const loadEmbeddedImages = useLoadEmbeddedImages(localID);
    const markAsRead = useMarkAsRead(localID);

    const messageLoaded = !!message.data?.Subject;
    const bodyLoaded = !!message.initialized;
    const unread = isUnread(message.data);

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
        if (message.data?.Subject === undefined) {
            addAction(load);
        }

        if (!draft && !bodyLoaded && expanded) {
            prepareMessage();
        }

        // This particular combination can appear when a message is loaded then marked as unread
        if (!draft && bodyLoaded && unread && expanded) {
            addAction(markAsRead);
        }
    }, [draft, bodyLoaded, expanded]);

    if (!messageLoaded) {
        return null;
    }

    const handleLoadRemoteImages = async () => {
        await addAction(loadRemoteImages);
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
        <article ref={elementRef} className={classnames(['message-container mb2', expanded && 'is-opened'])}>
            {expanded ? (
                <>
                    <HeaderExpanded
                        message={message}
                        messageLoaded={bodyLoaded}
                        sourceMode={sourceMode}
                        onLoadRemoteImages={handleLoadRemoteImages}
                        onLoadEmbeddedImages={handleLoadEmbeddedImages}
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
                <HeaderCollapsed message={message} labels={labels} onExpand={handleExpand(true)} />
            )}
        </article>
    );
};

export default MessageView;
