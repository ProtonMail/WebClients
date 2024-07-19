import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { NavLinkProps } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

import clsx from '@proton/utils/clsx';

export interface Props extends Omit<NavLinkProps, 'className'> {
    children: ReactNode;
    itemClassName?: string;
    className?: string;
}

const SidebarListItemLink = forwardRef<HTMLAnchorElement, Props>(
    ({ children, itemClassName = 'navigation-link', className, ...rest }: Props, ref: Ref<HTMLAnchorElement>) => {
        return (
            <NavLink ref={ref} className={clsx([itemClassName, className])} {...rest}>
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

SidebarListItemLink.displayName = 'SidebarListItemLink';

export default SidebarListItemLink;
