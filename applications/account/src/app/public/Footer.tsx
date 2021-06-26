import React from 'react';
import { classnames } from 'react-components';

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
