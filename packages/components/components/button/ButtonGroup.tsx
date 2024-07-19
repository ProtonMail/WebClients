import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import { Children, Fragment, cloneElement, forwardRef, isValidElement } from 'react';

import { Vr } from '@proton/atoms';
import type { ThemeColor } from '@proton/colors';
import clsx from '@proton/utils/clsx';

export type Color = `${ThemeColor.Norm | ThemeColor.Weak}`;

export type Shape = 'solid' | 'outline' | 'ghost';

export type Size = 'small' | 'medium' | 'large';

export interface Props extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    color?: Color;
    shape?: Shape;
    size?: Size;
    separators?: boolean;
    pill?: boolean;
    removeBackgroundColorOnGroup?: Boolean;
}

const ButtonGroup = forwardRef<HTMLDivElement, Props>(
    (
        {
            children,
            separators = true,
            color = 'weak',
            shape = 'outline',
            size = 'medium',
            pill = false,
            removeBackgroundColorOnGroup = false,
            className = '',
            ...rest
        },
        ref
    ) => {
        const childrenWithSeparators = Children.toArray(children)
            .filter((x): x is ReactElement => x !== null && isValidElement(x))
            .map((child, index, array) => {
                const clonedChild = cloneElement(child, { group: true, size, color, shape });
                if (index === array.length - 1) {
                    return clonedChild;
                }
                return (
                    // eslint-disable-next-line react/no-array-index-key
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
