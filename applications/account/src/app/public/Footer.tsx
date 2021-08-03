import * as React from 'react';
import { classnames } from '@proton/components';

interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode;
}

const Footer = ({ children, className, ...rest }: Props) => {
    return (
        <div className={classnames(['border-top flex p1', className])} {...rest}>
            {children}
        </div>
    );
};

export default Footer;
