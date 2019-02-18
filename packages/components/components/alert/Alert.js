import React from 'react';
import PropTypes from 'prop-types';

const CLASSES = {
    info: 'mb1 block-info',
    warning: 'mb1 block-info-error',
    error: 'mb1 block-info-warning'
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