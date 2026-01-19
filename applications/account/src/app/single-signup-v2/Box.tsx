import type { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'div'> {}

const Box = ({ children, className, ...rest }: Props) => {
    return (
        <div className={clsx('single-box relative w-full max-w-custom', className)} style={{ '--max-w-custom': '57rem' }} {...rest}>
            {children}
        </div>
    );
};

export default Box;
