import React from 'react';

import { classnames } from '../../helpers';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import { CircleLoader } from '../loader';

type Shape = 'solid' | 'outline' | 'ghost' | 'link';

type Color = 'norm' | 'weak' | 'danger' | 'warning' | 'success' | 'info';

type Size = 'small' | 'medium' | 'large';

interface ButtonLikeOwnProps {
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
    /** If true, the button will take up the full width of its container. */
    fullWidth?: boolean;
    /** If true, display as pill */
    pill?: boolean;
    /** If true, display as icon */
    icon?: boolean;
    /** If true, display as part of button group */
    group?: boolean;
}

export type ButtonLikeProps<E extends React.ElementType> = PolymorphicComponentProps<E, ButtonLikeOwnProps>;

const defaultElement = 'button';

const ButtonLike: <E extends React.ElementType = typeof defaultElement>(
    props: ButtonLikeProps<E>
) => React.ReactElement | null = React.forwardRef(
    <E extends React.ElementType = typeof defaultElement>(
        {
            loading = false,
            disabled = false,
            className,
            tabIndex,
            children,
            shape = 'solid',
            color = 'weak',
            size = 'medium',
            fullWidth,
            pill,
            icon,
            group,
            ...restProps
        }: ButtonLikeProps<E>,
        ref: typeof restProps.ref
    ) => {
        const isDisabled = loading || disabled;

        const buttonClassName = classnames([
            shape === 'link' ? 'button-link' : 'button-henlo',
            pill && 'button-pill',
            icon && 'button-for-icon',
            group && 'grouped-button',
            size !== 'medium' && `button-${size}`,
            `button-${shape}-${color}`,
            restProps.as !== 'button' ? 'inline-block text-center' : '',
            fullWidth && 'w100',
            className,
        ]);

        const roleProps = restProps.onClick ? { role: 'button' } : undefined;

        return (
            <Box
                as={defaultElement}
                ref={ref}
                className={buttonClassName}
                disabled={isDisabled}
                tabIndex={isDisabled ? -1 : tabIndex}
                aria-busy={loading}
                {...roleProps}
                {...restProps}
            >
                {children}
                {loading && (
                    <span className="loader-container">
                        <CircleLoader />
                    </span>
                )}
            </Box>
        );
    }
);

export default ButtonLike;
