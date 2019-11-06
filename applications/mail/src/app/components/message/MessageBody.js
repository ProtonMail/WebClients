import React from 'react';
import PropTypes from 'prop-types';

const MessageBody = ({ content }) => {
    return <div className="p1 bodyDecrypted" dangerouslySetInnerHTML={{ __html: content }} />;
};

MessageBody.propTypes = {
    content: PropTypes.string.isRequired
};

export default MessageBody;
