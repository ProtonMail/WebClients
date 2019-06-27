import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icon/Icon';
import Button from './Button';

const IconButton = ({ className, icon, fill, ...rest }) => {
    return (
        <Button className={`pm-button--for-icon ${className}`} {...rest}>
            <Icon name={icon} fill={fill} />
        </Button>
    );
};

IconButton.propTypes = {
    icon: PropTypes.string.isRequired,
    fill: PropTypes.string,
    className: PropTypes.string
};

IconButton.defaultProps = {
    className: ''
};

export default IconButton;
