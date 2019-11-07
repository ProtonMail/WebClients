import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useToggle, Loader } from 'react-components';

import { useGetDecryptedMessage } from './hooks/useGetDecryptedMessage';
import { useFormatContent } from './hooks/useFormatContent';
import { useLoadMessage } from './hooks/useLoadMessage';
// import { usePrepareMessage } from './hooks/usePrepareMessage';
import MessageBody from './MessageBody';
import MessageHeaderCollapsed from './MessageHeaderCollapsed';
import MessageHeaderExpanded from './MessageHeaderExpanded';

const MessageView = ({ labels, message: inputMessage, mailSettings }) => {
    const [message, loadMessage] = useLoadMessage(inputMessage);
    const getDecryptedMessage = useGetDecryptedMessage();
    const { initialize, loadImages } = useFormatContent();

    const { state: expanded, set: setExpanded } = useToggle();
    const { state: showDetails, toggle: toggleDetails } = useToggle();

    // Not using usePromiseResult as in this case the task has to be called later
    const [loaded, setLoaded] = useState(false);
    const [messageMetadata, setMessageMetadata] = useState({});

    // TODO: Handle cache
    const prepareMessage = async () => {
        const message = await loadMessage();
        const raw = await getDecryptedMessage(message);
        const metadata = await initialize({ raw }, message);
        setMessageMetadata(metadata);
        setLoaded(true);
    };

    const handleLoadImages = async () => {
        const metadata = await loadImages(messageMetadata, message);
        setMessageMetadata(metadata);
    };

    const handleExpand = () => {
        setExpanded(true);
        prepareMessage();
    };

    return expanded ? (
        <MessageHeaderExpanded
            message={message}
            messageMetadata={messageMetadata}
            onLoadImages={handleLoadImages}
            labels={labels}
            mailSettings={mailSettings}
            showDetails={showDetails}
            toggleDetails={toggleDetails}
        >
            {loaded ? <MessageBody content={messageMetadata.content} /> : <Loader />}
        </MessageHeaderExpanded>
    ) : (
        <MessageHeaderCollapsed message={message} onExpand={handleExpand} />
    );
};

MessageView.propTypes = {
    labels: PropTypes.array,
    mailSettings: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired
};

export default MessageView;
