import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { classnames } from '../../helpers/component';

export interface Props extends NavLinkProps {
    children: React.ReactNode;
    itemClassName?: string;
}

const SidebarListItemLink = ({ children, itemClassName = 'navigation__link', className, ...rest }: Props) => {
    return (
        <NavLink className={classnames([itemClassName, className])} {...rest}>
            {children}
        </NavLink>
    );
};

export const SubSidebarListItemLink = ({ children, ...rest }: Props) => {
    return (
        <SidebarListItemLink itemClassName="navigation__sublink" {...rest}>
            {children}
        </SidebarListItemLink>
    );
};

export default SidebarListItemLink;
