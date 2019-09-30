import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMailSettings } from 'react-components';

const MailboxContainer = ({ labelID, location, history }) => {
    const [mailSettings] = useMailSettings();

    return MailboxContainer;
};

MailboxContainer.propTypes = {
    labelID: PropTypes.string,
    conversationID: PropTypes.string,
    location: PropTypes.object,
    history: PropTypes.object
};

export default MailboxContainer;
