import * as React from 'react';

import { classnames } from '../../helpers';
import { Box, PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';
import { CircleLoader } from '../loader';

export type Shape = 'solid' | 'outline' | 'ghost' | 'link';

export type Color = 'norm' | 'weak' | 'danger' | 'warning' | 'success' | 'info';

export type Size = 'small' | 'medium' | 'large';

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
    /** If true, this button is part of a button group */
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
            shape: shapeProp,
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

        const shape = shapeProp || (color === 'weak' ? 'outline' : 'solid');

        const actualShape = group ? 'ghost' : shape;
        const actualColor = group ? 'weak' : color;

        const buttonClassName = classnames([
            actualShape === 'link' ? 'button-link' : 'button-henlo',
            pill && 'button-pill',
            icon && 'button-for-icon',
            group && 'button-group-item',
            size !== 'medium' && `button-${size}`,
            `button-${actualShape}-${actualColor}`,
            restProps.as !== 'button' ? 'inline-block text-center' : '',
            fullWidth && 'w100',
            className,
        ]);

        const roleProps = restProps.onClick && !restProps.type ? { role: 'button' } : undefined;

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

(ButtonLike as any).displayName = 'ButtonLike';
export default ButtonLike;
