import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './Box.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {}

const Box = ({ children, className, ...rest }: Props) => {
    return (
        <div className={clsx('single-box relative', className)} {...rest}>
            {children}
        </div>
    );
};

export default Box;
