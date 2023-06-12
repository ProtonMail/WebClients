import { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

export interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

const Footer = ({ children, className, ...rest }: Props) => {
    return (
        <footer className={clsx(['footer flex flex-nowrap reset4print', className])} {...rest}>
            {children}
        </footer>
    );
};

export default Footer;
