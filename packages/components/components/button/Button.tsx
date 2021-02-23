import React from 'react';

import Icon, { Props as IconProps } from '../icon/Icon';
import { classnames } from '../../helpers';

type Shape = 'solid' | 'outline' | 'ghost';

type Color = 'norm' | 'weak' | 'danger' | 'warning' | 'success' | 'info';

type Size = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
    buttonRef?: React.Ref<HTMLButtonElement>;
    icon?: React.ReactNode;
    /**
     * Props supplied to the Icon component.
     * The Icon component only renders if the "icon" prop is supplied.
     */
    iconProps?: IconProps;
    /**
     * Whether the button should render a loader.
     * Button is disabled when this prop is true.
     */
    loading?: boolean;
    shape?: Shape;
    /**
     * Controls the colors of the button.
     * Exact styles applied depend on the chosen shape as well.
     */
    color?: Color;
    /**
     * Controls how large the button should be.
     */
    size?: Size;
    /** Puts the button in a disabled state. */
    disabled?: boolean;
}

const Button = ({
    buttonRef,
    type = 'button',
    loading = false,
    disabled = false,
    className,
    tabIndex,
    icon,
    iconProps,
    children,
    shape: shapeProp,
    color: colorProp,
    size: sizeProp,
    ...rest
}: ButtonProps) => {
    const shape = shapeProp || 'solid';

    const color = colorProp || 'weak';

    const size = sizeProp || 'medium';

    const isDisabled = loading || disabled;

    const isUsingLegacyApi = !shapeProp && !colorProp && !sizeProp;

    const iconComponent =
        typeof icon === 'string' ? (
            <Icon name={icon} {...iconProps} className={classnames(['flex-item-noshrink', iconProps?.className])} />
        ) : (
            icon
        );

    const iconButtonClass = isUsingLegacyApi ? 'button--for-icon' : 'button-for-icon';

    const buttonClassName = classnames([
        isUsingLegacyApi ? 'button' : 'button-henlo',
        !isUsingLegacyApi && size !== 'medium' && `button-${size}`,
        !isUsingLegacyApi && `button-${shape}-${color}`,
        !children && iconButtonClass,
        className,
    ]);

    return (
        <button
            ref={buttonRef}
            type={type}
            className={buttonClassName}
            disabled={isDisabled}
            tabIndex={isDisabled ? -1 : tabIndex}
            aria-busy={loading}
            {...rest}
        >
            {children}
            {iconComponent}
        </button>
    );
};

export default Button;
