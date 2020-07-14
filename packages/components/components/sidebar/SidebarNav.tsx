import React from 'react';
import { classnames } from '../../helpers/component';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

const SidebarNav = ({ children, className, ...rest }: Props) => {
    return (
        <nav className={classnames(['navigation mw100 flex-item-fluid-auto', className])} {...rest}>
            {children}
        </nav>
    );
};

export default SidebarNav;
