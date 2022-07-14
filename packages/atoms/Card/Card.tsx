import { ElementType } from 'react';
import { Box, PolymorphicComponentProps } from 'react-polymorphic-box';

import clsx from '@proton/utils/clsx';

export interface CardOwnProps {
    bordered?: boolean;
    rounded?: boolean;
    background?: boolean;
}

export type CardProps<E extends ElementType> = PolymorphicComponentProps<E, CardOwnProps>;

const element = 'div';

const Card = <E extends ElementType = typeof element>({
    className,
    bordered = true,
    rounded = false,
    background = true,
    ...rest
}: CardProps<E>) => {
    return (
        <Box
            as={element}
            className={clsx('p1', className, rounded && 'rounded', bordered && 'border', background && 'bg-weak')}
            {...rest}
        />
    );
};

export default Card;
