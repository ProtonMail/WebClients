import type { ElementType, ForwardedRef } from 'react';
import { forwardRef } from 'react';

import type { ThemeColorUnion } from '@proton/colors';
import type { PolymorphicForwardRefExoticComponent, PolymorphicPropsWithRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import './ButtonLike.scss';
import CircleLoader from '../CircleLoader/CircleLoader';

export type ButtonLikeShape = 'solid' | 'outline' | 'ghost' | 'underline';

export type ButtonLikeSize = 'small' | 'medium' | 'large';

export interface ButtonLikeOwnProps {
    /**
     * Whether the button should render a loader.
     * Button is disabled when this prop is true.
     */
    loading?: boolean;
    /**
     * Controls the shape of the button.
     * - `solid` for filled button
     * - `outline` for bordered button
     * - `ghost` for minimalistic button with hover/focus changing
     * - `underline` for underlined text button, with paddings for alignment
     */
    shape?: ButtonLikeShape;
    /**
     * Controls the colors of the button.
     * Exact styles applied depend on the chosen shape as well.
     */
    color?: ThemeColorUnion;
    /**
     * Controls how large the button should be.
     */
    size?: ButtonLikeSize;
    /**
     * Puts the button in a disabled state.
     */
    disabled?: boolean;
    /**
     * If true, the button will take up the full width of its container.
     */
    fullWidth?: boolean;
    /**
     * If true, display as pill.
     */
    pill?: boolean;
    /**
     * If true, display as icon.
     */
    icon?: boolean;
    /**
     * If true, this button is part of a button group.
     */
    group?: boolean;
    /**
     * For a selected item inside a group.
     */
    selected?: boolean;
    /**
     * Locator for e2e tests.
     */
    'data-testid'?: string;
}

export type ButtonLikeProps<E extends ElementType> = PolymorphicPropsWithRef<ButtonLikeOwnProps, E>;

const defaultElement = 'button';

const ButtonLikeBase = <E extends ElementType = typeof defaultElement>(
    {
        loading = false,
        disabled = false,
        className,
        tabIndex,
        children,
        shape: shapeProp,
        color = 'weak',
        size = 'medium',
        fullWidth,
        pill,
        icon,
        group,
        selected = false,
        as,
        'data-testid': dataTestId,
        ...restProps
    }: ButtonLikeProps<E>,
    ref: ForwardedRef<Element>
) => {
    const isDisabled = loading || disabled;

    const shape = shapeProp || (color === 'weak' ? 'outline' : 'solid');

    const isUnderlineShape = shape === 'underline';
    const Element: ElementType = as || defaultElement;

    const buttonClassName = clsx(
        isUnderlineShape ? 'button-underline' : 'button',
        !isUnderlineShape && pill && 'button-pill',
        !isUnderlineShape && icon && 'button-for-icon',
        !isUnderlineShape && fullWidth && 'w-full',
        group && 'button-group-item',
        group && selected && 'is-selected',
        `button-${size}`,
        `button-${shape}-${color}`,
        Element !== 'button' && 'inline-block text-center',
        className
    );

    const roleProps = restProps.onClick && !restProps.type && as !== 'a' ? { role: 'button' } : undefined;

    return (
        <Element
            ref={ref}
            className={buttonClassName}
            disabled={isDisabled}
            tabIndex={isDisabled ? -1 : tabIndex}
            aria-busy={loading}
            data-testid={dataTestId}
            {...roleProps}
            {...restProps}
        >
            {children}
            {loading && (
                <span className="button-loader-container">
                    <CircleLoader />
                </span>
            )}
        </Element>
    );
};

const ButtonLike: PolymorphicForwardRefExoticComponent<ButtonLikeOwnProps, typeof defaultElement> =
    forwardRef(ButtonLikeBase);

export default ButtonLike;
