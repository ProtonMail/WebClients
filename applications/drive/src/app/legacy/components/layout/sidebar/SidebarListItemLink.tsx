import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import type { NavLinkProps } from 'react-router-dom-v5-compat';
import { NavLink } from 'react-router-dom-v5-compat';

import clsx from '@proton/utils/clsx';

export interface Props extends Omit<NavLinkProps, 'className'> {
    children: ReactNode;
    itemClassName?: string;
    className?: string;
    forceReload?: boolean;
}

const SidebarListItemLink = forwardRef<HTMLAnchorElement, Props>(
    (
        { children, itemClassName = 'navigation-link', className, forceReload, to, style, ...rest }: Props,
        ref: Ref<HTMLAnchorElement>
    ) => {
        if (forceReload) {
            return (
                <a ref={ref} href={to.toString()} className={clsx([itemClassName, className])} {...rest}>
                    {children}
                </a>
            );
        }
        return (
            <NavLink to={to} style={style} ref={ref} className={clsx([itemClassName, className])} {...rest}>
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
