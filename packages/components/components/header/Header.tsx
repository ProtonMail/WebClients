import { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

export interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

const Header = ({ children, className, ...rest }: Props) => {
    return (
        <header className={clsx(['header flex flex-nowrap reset4print', className])} {...rest}>
            {children}
        </header>
    );
};

export default Header;
