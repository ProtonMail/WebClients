import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import { Children, Fragment, cloneElement, forwardRef, isValidElement } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import { Vr } from '@proton/atoms/Vr/Vr';
import type { ThemeColor } from '@proton/colors';
import clsx from '@proton/utils/clsx';

export type Color = `${ThemeColor.Norm | ThemeColor.Weak}`;

export interface Props extends Omit<ComponentPropsWithoutRef<'div'>, 'color'> {
    children: ReactNode;
    color?: Color;
    shape?: ButtonLikeShape;
    size?: ButtonLikeSize;
    /* If true, allows setting the color of individual buttons inside the button group */
    individualButtonColor?: boolean;
    separators?: boolean;
    pill?: boolean;
    removeBackgroundColorOnGroup?: Boolean;
}

export const ButtonGroup = forwardRef<HTMLDivElement, Props>(
    (
        {
            children,
            separators = true,
            color = 'weak',
            individualButtonColor,
            shape = 'outline',
            size = 'medium',
            pill = false,
            removeBackgroundColorOnGroup = false,
            className = '',
            ...rest
        },
        ref
    ) => {
        const buttonChildProps: Pick<ButtonProps, 'group' | 'size' | 'shape'> & { color?: ButtonProps['color'] } = {
            group: true,
            size,
            shape,
            color,
        };
        if (individualButtonColor) {
            delete buttonChildProps.color;
        }
        const childrenWithSeparators = Children.toArray(children)
            .filter((element): element is ReactElement => element !== null && isValidElement(element))
            .map((child, index, array) => {
                const clonedChild = cloneElement(child, buttonChildProps);
                if (index === array.length - 1) {
                    return clonedChild;
                }
                return (
                    <Fragment key={clonedChild.key || index}>
                        {clonedChild}
                        {separators && !pill && <Vr aria-hidden="true" />}
                    </Fragment>
                );
            });
        return (
            <div
                className={clsx(
                    'button-group',
                    `button-group-${shape}-${color}`,
                    `button-group-${size}`,
                    pill && 'button-group-pill',
                    removeBackgroundColorOnGroup && 'button-group--no-bg-color',
                    className
                )}
                ref={ref}
                {...rest}
            >
                {childrenWithSeparators}
            </div>
        );
    }
);

ButtonGroup.displayName = 'ButtonGroup';

export default ButtonGroup;
