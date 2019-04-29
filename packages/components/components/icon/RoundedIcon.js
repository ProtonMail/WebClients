import React from 'react';
import PropTypes from 'prop-types';

import Icon from './Icon';

const TYPES = {
    success: 'bg-global-success',
    warning: 'bg-global-attention',
    error: 'bg-global-warning'
};

const RoundedIcon = ({ className, type, padding, ...rest }) => {
    return (
        <span className={`${className} ${padding} ${TYPES[type]}`}>
            <Icon {...rest} />
        </span>
    );
};

RoundedIcon.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    padding: PropTypes.string
};

RoundedIcon.defaultProps = {
    className: 'inline-flex rounded50',
    type: 'success',
    padding: 'p0-25'
};

export default RoundedIcon;
