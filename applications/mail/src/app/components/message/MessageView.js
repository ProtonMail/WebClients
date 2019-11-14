import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useToggle, Loader, classnames } from 'react-components';

import { useComputeMessage } from './hooks/useComputeMessage';
import { hasAttachments } from './logic/message';

import MessageBody from './MessageBody';
import MessageHeaderCollapsed from './MessageHeaderCollapsed';
import MessageHeaderExpanded from './MessageHeaderExpanded';
import MessageFooter from './MessageFooter';

const MessageView = ({ labels, message: inputMessage, mailSettings, initialExpand, conversationIndex }) => {
    const { state: expanded, set: setExpanded } = useToggle(initialExpand);
    const [loaded, setLoaded] = useState(false);
    const [message, setMessage] = useState({ data: inputMessage });
    const elementRef = useRef();

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

    const handleExpand = (value) => () => {
        setExpanded(value);
    };

    return (
        <article ref={elementRef} className={classnames(['message-container mb2', expanded && 'is-opened'])}>
            {expanded ? (
                <>
                    <MessageHeaderExpanded
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
                <MessageHeaderCollapsed message={message} labels={labels} onExpand={handleExpand(true)} />
            )}
        </article>
    );
};

MessageView.propTypes = {
    labels: PropTypes.array,
    mailSettings: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired,
    initialExpand: PropTypes.bool.isRequired,
    conversationIndex: PropTypes.number.isRequired
};

export default MessageView;
