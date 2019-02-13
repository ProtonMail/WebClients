import React from 'react';
import PropTypes from 'prop-types';

const CLASSES = {
    info: 'p1 mb1 bg-global-light color-global-grey',
    warning: 'p1 mb1 bg-global-attention color-global-grey',
    error: 'p1 mb1 bg-global-warning color-white'
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