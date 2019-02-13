import React from 'react';
import PropTypes from 'prop-types';

const CLASSNAMES = {
    success: 'badgeLabel-success',
    default: 'badgeLabel',
    origin: 'badgeLabel-grey',
    warning: 'badgeLabel-warning',
    error: 'badgeLabel-error'
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