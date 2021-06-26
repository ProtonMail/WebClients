import React from 'react';
import { classnames } from '../../helpers';

interface Props extends React.ComponentPropsWithoutRef<'footer'> {
    children?: React.ReactNode;
    isColumn?: boolean;
}

const Footer = ({
    children,
    isColumn,
    className = classnames([
        'flex flex-nowrap',
        isColumn ? 'flex-column' : 'flex-justify-space-between flex-align-items-center',
    ]),
    ...rest
}: Props) => {
    return (
        <footer className={classnames(['modal-footer', className])} {...rest}>
            {children}
        </footer>
    );
};

export default Footer;
