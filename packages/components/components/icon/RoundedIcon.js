import React from 'react';
import PropTypes from 'prop-types';

import Icon from './Icon';
import { classnames } from '../../helpers/component';

const TYPES = {
    success: 'bg-global-success',
    warning: 'bg-global-attention',
    error: 'bg-global-warning'
};

const RoundedIcon = ({
    className = '',
    iconClassName = 'color-white',
    type = 'success',
    padding = 'p0-5',
    title,
    ...rest
}) => {
    return (
        <span
            className={classnames(['inline-flex rounded50 flex-item-noshrink', className, padding, TYPES[type]])}
            title={title}
        >
            <Icon size="12" className={iconClassName} {...rest} />
        </span>
    );
};

RoundedIcon.propTypes = {
    iconClassName: PropTypes.string,
    className: PropTypes.string,
    type: PropTypes.string,
    title: PropTypes.string,
    padding: PropTypes.string
};

export default RoundedIcon;
