import { HTMLAttributes, ReactNode } from 'react';

import { classnames } from '../../helpers';

export interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

const Footer = ({ children, className, ...rest }: Props) => {
    return (
        <footer className={classnames(['footer flex flex-nowrap reset4print', className])} {...rest}>
            {children}
        </footer>
    );
};

export default Footer;
