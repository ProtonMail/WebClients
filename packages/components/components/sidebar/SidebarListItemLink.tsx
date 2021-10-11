import { forwardRef, ReactNode, Ref } from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { classnames } from '../../helpers';

export interface Props extends NavLinkProps {
    children: ReactNode;
    itemClassName?: string;
}

const SidebarListItemLink = forwardRef<HTMLAnchorElement, Props>(
    ({ children, itemClassName = 'navigation-link', className, ...rest }: Props, ref: Ref<HTMLAnchorElement>) => {
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

SidebarListItemLink.displayName = 'SidebarListItemLink';

export default SidebarListItemLink;
