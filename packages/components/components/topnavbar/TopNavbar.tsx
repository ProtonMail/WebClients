import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'div'> {}

const TopNavbar = ({ children, className, ...rest }: Props) => {
    return (
        <div
            className={clsx([
                'topnav-container flex flex-none md:flex-initial justify-end flex-align-self-center my-auto ml-auto md:ml-0 no-print',
                className,
            ])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default TopNavbar;
