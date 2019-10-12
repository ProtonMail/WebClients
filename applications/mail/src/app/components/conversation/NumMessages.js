import React from 'react';
import PropTypes from 'prop-types';

const NumMessages = ({ conversation, className }) => {
    // ContextNumMessages shoud not be used
    const { NumMessages = 0 } = conversation;

    if (NumMessages === 0) {
        return null;
    }

    return <span className={className}>({NumMessages})</span>;
};

NumMessages.propTypes = {
    className: PropTypes.string,
    conversation: PropTypes.object.isRequired
};

export default NumMessages;
