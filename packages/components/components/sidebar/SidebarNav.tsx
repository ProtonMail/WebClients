import { HTMLAttributes, ReactNode } from 'react';

import { classnames } from '../../helpers';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
}

const SidebarNav = ({ children, className, ...rest }: Props) => {
    return (
        <nav className={classnames(['navigation max-w100 flex-item-fluid-auto', className])} {...rest}>
            {children}
        </nav>
    );
};

export default SidebarNav;
