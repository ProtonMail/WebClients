import React from 'react';
import PropTypes from 'prop-types';

import Icon from './Icon';
import { classnames } from '../../helpers/component';

const TYPES = {
    success: 'bg-global-success',
    warning: 'bg-global-attention',
    error: 'bg-global-warning'
};

const RoundedIcon = ({ className = 'inline-flex rounded50', type = 'success', padding = 'p0-25', ...rest }) => {
    return (
        <span className={classnames([className, padding, TYPES[type]])}>
            <Icon {...rest} />
        </span>
    );
};

RoundedIcon.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    padding: PropTypes.string
};

export default RoundedIcon;
