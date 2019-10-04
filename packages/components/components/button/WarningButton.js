import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icon/Icon';
import Button from './Button';
import { classnames } from '../../helpers/component';

const WarningButton = ({ children, className = '', icon, ...rest }) => {
    const buttonIcon = typeof icon === 'string' ? <Icon name={icon} fill="light" /> : icon;

    return (
        <Button icon={buttonIcon} className={classnames(['pm-button--warning', className])} {...rest}>
            {children}
        </Button>
    );
};

WarningButton.propTypes = {
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    children: PropTypes.node,
    className: PropTypes.string
};

export default WarningButton;
