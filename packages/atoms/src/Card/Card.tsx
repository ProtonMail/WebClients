import type { ElementType } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

export type CardRadius = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const radiusClassNames: Record<CardRadius, string> = {
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    xxl: 'rounded-xxl',
};

export interface CardOwnProps {
    bordered?: boolean;
    /**
     * `true` is the default radius (`md`). Pass a size to pick another one.
     */
    rounded?: boolean | CardRadius;
    background?: boolean;
    padded?: boolean;
}

export type CardProps<E extends ElementType> = PolymorphicPropsWithoutRef<CardOwnProps, E>;

const defaultElement = 'div';

export const Card = <E extends ElementType = typeof defaultElement>({
    className,
    bordered = true,
    rounded = false,
    background = true,
    padded = true,
    as,
    ...rest
}: CardProps<E>) => {
    const Element: ElementType = as || defaultElement;
    return (
        <Element
            className={clsx(
                padded && 'p-4',
                className,
                rounded && radiusClassNames[rounded === true ? 'md' : rounded],
                bordered && 'border',
                background && 'bg-weak'
            )}
            {...rest}
        />
    );
};
