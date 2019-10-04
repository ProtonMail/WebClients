import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers/component';

const Button = ({
    type = 'button',
    role = 'button',
    loading = false,
    tabIndex,
    buttonRef,
    className = '',
    children,
    title,
    disabled = false,
    icon,
    ...rest
}) => {
    const iconComponent = typeof icon === 'string' ? <Icon className="flex-item-noshrink" name={icon} /> : icon;
    const iconButtonClass = !children ? 'pm-button--for-icon' : '';

    return (
        <button
            role={role}
            disabled={loading ? true : disabled}
            className={classnames(['pm-button', iconButtonClass, className])}
            type={type}
            tabIndex={disabled ? '-1' : tabIndex}
            title={title}
            ref={buttonRef}
            aria-busy={loading}
            {...rest}
        >
            {iconComponent}
            {children}
        </button>
    );
};

Button.propTypes = {
    loading: PropTypes.bool,
    role: PropTypes.string,
    tabIndex: PropTypes.string,
    title: PropTypes.string,
    disabled: PropTypes.bool,
    buttonRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    onClick: PropTypes.func,
    onKeyDown: PropTypes.func,
    onKeyUp: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    type: PropTypes.string,
    className: PropTypes.string,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    children: PropTypes.node
};

export default Button;
