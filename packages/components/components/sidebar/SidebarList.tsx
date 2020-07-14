import React, { ReactNode } from 'react';
import { classnames } from '../../helpers/component';

interface Props extends React.HTMLAttributes<HTMLUListElement> {
    listClassName?: string;
    className?: string;
    children?: ReactNode;
}

const SidebarList = ({ className, listClassName = 'navigation__list', children, ...rest }: Props) => {
    return (
        <ul className={classnames(['unstyled mt0', listClassName, className])} {...rest}>
            {children}
        </ul>
    );
};

export const SubSidebarList = ({ children, ...rest }: Props) => {
    return (
        <SidebarList listClassName="navigation__sublist" {...rest}>
            {children}
        </SidebarList>
    );
};

export default SidebarList;
