import React from 'react';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers';

export interface Props
    extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    loading?: boolean;
    buttonRef?: React.Ref<HTMLButtonElement>;
    icon?: React.ReactNode;
}

const Button = ({
    type = 'button',
    role = 'button',
    loading = false,
    disabled = false,
    className,
    tabIndex,
    buttonRef,
    children,
    icon,
    ...rest
}: Props) => {
    const iconComponent = typeof icon === 'string' ? <Icon className="flex-item-noshrink" name={icon} /> : icon;
    const iconButtonClass = !children ? 'button--for-icon' : '';

    return (
        <button
            role={role}
            disabled={loading ? true : disabled}
            className={classnames(['button', iconButtonClass, className])}
            type={type}
            tabIndex={disabled ? -1 : tabIndex}
            ref={buttonRef}
            aria-busy={loading}
            {...rest}
        >
            {iconComponent}
            {children}
        </button>
    );
};

export default Button;
