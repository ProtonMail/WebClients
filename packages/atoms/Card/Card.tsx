import { ElementType } from 'react';

import { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

export interface CardOwnProps {
    bordered?: boolean;
    rounded?: boolean;
    background?: boolean;
}

export type CardProps<E extends ElementType> = PolymorphicPropsWithoutRef<CardOwnProps, E>;

const defaultElement = 'div';

const Card = <E extends ElementType = typeof defaultElement>({
    className,
    bordered = true,
    rounded = false,
    background = true,
    as,
    ...rest
}: CardProps<E>) => {
    const Element: ElementType = as || defaultElement;
    return (
        <Element
            className={clsx('p-4', className, rounded && 'rounded', bordered && 'border', background && 'bg-weak')}
            {...rest}
        />
    );
};

export default Card;
