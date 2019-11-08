import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useToggle, Loader } from 'react-components';

import { useComputeMessage } from './hooks/useComputeMessage';

import MessageBody from './MessageBody';
import MessageHeaderCollapsed from './MessageHeaderCollapsed';
import MessageHeaderExpanded from './MessageHeaderExpanded';

const MessageView = ({ labels, message: inputMessage, mailSettings }) => {
    const { state: expanded, set: setExpanded } = useToggle();
    const { state: showDetails, toggle: toggleDetails } = useToggle();

    // Not using usePromiseResult as in this case the task has to be called later
    const [loaded, setLoaded] = useState(false);

    const [message, setMessage] = useState({ data: inputMessage });

    const { initialize, loadImages } = useComputeMessage(mailSettings);

    const prepareMessage = async () => {
        setMessage(await initialize(message));
        setLoaded(true);
    };

    const handleLoadImages = async () => {
        setMessage(await loadImages(message));
    };

    const handleExpand = () => {
        setExpanded(true);
        prepareMessage();
    };

    return expanded ? (
        <MessageHeaderExpanded
            message={message}
            messageLoaded={loaded}
            onLoadImages={handleLoadImages}
            labels={labels}
            mailSettings={mailSettings}
            showDetails={showDetails}
            toggleDetails={toggleDetails}
        >
            {loaded ? <MessageBody content={message.content} /> : <Loader />}
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
