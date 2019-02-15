import React from 'react';
import PropTypes from 'prop-types';

const CLASSES = {
    info: 'mb1 information-block',
    warning: 'mb1 warning-block',
    error: 'mb1 error-block'
};

const Alert = ({ type, children }) => {
    return (
        <div className={CLASSES[type]}>{children}</div>
    );
};

Alert.propTypes = {
    type: PropTypes.oneOf(['info', 'error', 'warning']).isRequired,
    children: PropTypes.node.isRequired
};

Alert.defaultProps = {
    type: 'info'
};

export default Alert;