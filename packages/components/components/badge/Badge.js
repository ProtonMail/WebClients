import React from 'react';
import PropTypes from 'prop-types';

const CLASSNAMES = {
    success: 'mr1 badgeLabel-success',
    default: 'mr1 badgeLabel',
    origin: 'mr1 badgeLabel-grey',
    warning: 'mr1 badgeLabel-warning',
    error: 'mr1 badgeLabel-error'
};

const Badge = ({ children, type }) => <span className={CLASSNAMES[type]}>{children}</span>;

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    type: PropTypes.string
};

Badge.defaultProps = {
    type: 'default'
};

export default Badge;