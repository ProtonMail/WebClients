import React from 'react';

import { classnames } from '../../helpers';

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
    bordered?: boolean;
    rounded?: boolean;
}

const Card = ({ className, bordered = true, rounded = false, ...rest }: CardProps) => {
    return (
        <div
            className={classnames([rounded && 'rounded', bordered && 'bordered', 'p1 bg-weak', className])}
            {...rest}
        />
    );
};

export default Card;
