import * as React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { classnames } from '../../helpers';

export interface Props extends NavLinkProps {
    children: React.ReactNode;
    itemClassName?: string;
}

const SidebarListItemLink = React.forwardRef(
    ({ children, itemClassName = 'navigation-link', className, ...rest }: Props, ref: React.Ref<HTMLAnchorElement>) => {
        return (
            <NavLink ref={ref} className={classnames([itemClassName, className])} {...rest}>
                {children}
            </NavLink>
        );
    }
);

export const SubSidebarListItemLink = ({ children, ...rest }: Props) => {
    return (
        <SidebarListItemLink itemClassName="navigation-sublink" {...rest}>
            {children}
        </SidebarListItemLink>
    );
};

export default SidebarListItemLink;
