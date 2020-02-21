import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icon/Icon';
import Button from './Button';
import { classnames } from '../../helpers/component';

const ErrorButton = ({ children, className = '', icon, ...rest }) => {
    const buttonIcon = typeof icon === 'string' ? <Icon name={icon} className="color-global-light" /> : icon;

    return (
        <Button icon={buttonIcon} className={classnames(['pm-button--error', className])} {...rest}>
            {children}
        </Button>
    );
};

ErrorButton.propTypes = {
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    children: PropTypes.node,
    className: PropTypes.string
};

export default ErrorButton;
