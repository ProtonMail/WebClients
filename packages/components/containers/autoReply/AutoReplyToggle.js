import React from 'react';
import { Toggle, useToggle } from 'react-components';
import PropTypes from 'prop-types';

const AutoReplyToggle = ({ enabled, onToggle, ...rest }) => {
    const { state, toggle } = useToggle(enabled);

    const handleToggle = () => {
        onToggle();
        toggle();
    };

    return <Toggle {...rest} checked={state} onChange={handleToggle} />;
};

AutoReplyToggle.propTypes = {
    enabled: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
};

export default AutoReplyToggle;
