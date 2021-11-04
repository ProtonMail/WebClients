import { ComponentPropsWithoutRef } from 'react';
import { classnames } from '../../helpers';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
    bordered?: boolean;
    rounded?: boolean;
    background?: boolean;
}

const Card = ({ className, bordered = true, rounded = false, background = true, ...rest }: CardProps) => {
    return (
        <div
            className={classnames([
                rounded && 'rounded',
                bordered && 'bordered',
                background && 'bg-weak',
                'p1',
                className,
            ])}
            {...rest}
        />
    );
};

export default Card;
