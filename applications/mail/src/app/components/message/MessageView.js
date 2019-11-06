import React from 'react';
import PropTypes from 'prop-types';
import { useToggle, Loader } from 'react-components';

import { usePrepareMessage } from './hooks/usePrepareMessage';
import MessageBody from './MessageBody';
import MessageHeaderCollapsed from './MessageHeaderCollapsed';
import MessageHeaderExpanded from './MessageHeaderExpanded';

const MessageView = ({ labels, message: inputMessage, mailSettings }) => {
    const { state: showDetails, toggle: toggleDetails } = useToggle();
    const { message, messageMetadata, load } = usePrepareMessage(inputMessage);

    if (messageMetadata.expanded) {
        console.log('MessageView', messageMetadata, message);
    }

    return !messageMetadata.expanded ? (
        <MessageHeaderCollapsed message={message} onExpand={load} />
    ) : (
        <MessageHeaderExpanded
            message={message}
            labels={labels}
            mailSettings={mailSettings}
            showDetails={showDetails}
            toggleDetails={toggleDetails}
        >
            {messageMetadata.loading ? <Loader /> : <MessageBody content={messageMetadata.content} />}
        </MessageHeaderExpanded>
    );
};

MessageView.propTypes = {
    labels: PropTypes.array,
    mailSettings: PropTypes.object.isRequired,
    message: PropTypes.object.isRequired
};

export default MessageView;
