import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icon/Icon';
import Button from './Button';

const WarningButton = ({ children, className, icon, ...rest }) => {
    const buttonIcon = typeof icon === 'string' ? <Icon name={icon} fill="light" /> : icon;

    return (
        <Button icon={buttonIcon} className={`pm-button--warning ${className}`} {...rest}>
            {children}
        </Button>
    );
};

WarningButton.propTypes = {
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    children: PropTypes.node,
    className: PropTypes.string
};

WarningButton.defaultProps = {
    className: ''
};

export default WarningButton;
