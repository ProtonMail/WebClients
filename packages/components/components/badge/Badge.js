import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-components';

const CLASSNAMES = {
    success: 'mr1 badgeLabel-success',
    default: 'mr1 badgeLabel',
    origin: 'mr1 badgeLabel-grey',
    warning: 'mr1 badgeLabel-warning',
    error: 'mr1 badgeLabel-error'
};

const wrapTooltip = (children, title) => <Tooltip title={title}>{children}</Tooltip>;

const Badge = ({ children, type, tooltip }) => {
    let badge = <strong className={CLASSNAMES[type]}>{children}</strong>;

    if (tooltip) {
        badge = wrapTooltip(badge, tooltip);
    }

    return badge;
};

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    type: PropTypes.string,
    tooltip: PropTypes.string
};

Badge.defaultProps = {
    type: 'default'
};

export default Badge;
