import { ComponentPropsWithoutRef } from 'react';
import { classnames } from '../../helpers';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
    border?: boolean;
    rounded?: boolean;
    background?: boolean;
}

const Card = ({ className, border = true, rounded = false, background = true, ...rest }: CardProps) => {
    return (
        <div
            className={classnames([rounded && 'rounded', border && 'border', background && 'bg-weak', 'p1', className])}
            {...rest}
        />
    );
};

export default Card;
