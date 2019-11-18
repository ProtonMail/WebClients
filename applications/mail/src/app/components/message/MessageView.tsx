import React, { useState, useEffect, useRef } from 'react';
import { useToggle, Loader, classnames } from 'react-components';

import { useComputeMessage } from '../../hooks/useComputeMessage';
import { hasAttachments } from '../../helpers/message';
import { Label } from '../../models/label';

import MessageBody from './MessageBody';
import HeaderCollapsed from './header/HeaderCollapsed';
import HeaderExpanded from './header/HeaderExpanded';
import MessageFooter from './MessageFooter';
import { Message, MessageExtended } from '../../models/message';

interface Props {
    labels: Label[];
    message: Message;
    mailSettings: any;
    initialExpand: boolean;
    conversationIndex: number;
}

const MessageView = ({ labels = [], message: inputMessage, mailSettings, initialExpand, conversationIndex }: Props) => {
    const { state: expanded, set: setExpanded } = useToggle(initialExpand);
    const [loaded, setLoaded] = useState(false);
    const [message, setMessage] = useState({ data: inputMessage } as MessageExtended);
    const elementRef = useRef<HTMLElement>(null);

    const { initialize, loadRemoteImages, loadEmbeddedImages } = useComputeMessage(mailSettings);

    const prepareMessage = async () => {
        setMessage(await initialize(message));
        setLoaded(true);
        // Don't scroll if it's the first message of the conversation and only on the first automatic expand
        if (conversationIndex !== 0 && initialExpand) {
            elementRef.current && elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        if (!loaded && expanded) {
            prepareMessage();
        }
    }, [expanded]);

    const handleLoadRemoteImages = async () => {
        setMessage(await loadRemoteImages(message));
    };

    const handleLoadEmbeddedImages = async () => {
        setMessage(await loadEmbeddedImages(message));
    };

    const handleExpand = (value: boolean) => () => {
        setExpanded(value);
    };

    return (
        <article ref={elementRef} className={classnames(['message-container mb2', expanded && 'is-opened'])}>
            {expanded ? (
                <>
                    <HeaderExpanded
                        message={message}
                        messageLoaded={loaded}
                        onLoadRemoteImages={handleLoadRemoteImages}
                        onLoadEmbeddedImages={handleLoadEmbeddedImages}
                        labels={labels}
                        mailSettings={mailSettings}
                        onCollapse={handleExpand(false)}
                    />
                    {loaded ? (
                        <>
                            <MessageBody message={message} />
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
