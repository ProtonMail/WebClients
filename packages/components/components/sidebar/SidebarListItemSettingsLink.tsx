import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import type { Props as SettingsLinkProps } from '../link/SettingsLink';
import SettingsLink from '../link/SettingsLink';

export interface SidebarListItemSettingsLinkProps extends Omit<SettingsLinkProps, 'className'> {
    children: ReactNode;
    itemClassName?: string;
    className?: string;
}

const SidebarListItemSettingsLink = forwardRef<HTMLAnchorElement, SidebarListItemSettingsLinkProps>(
    (
        { children, itemClassName = 'navigation-link', className, ...rest }: SidebarListItemSettingsLinkProps,
        ref: Ref<HTMLAnchorElement>
    ) => {
        return (
            <SettingsLink ref={ref} className={clsx([itemClassName, className])} {...rest}>
                {children}
            </SettingsLink>
        );
    }
);

SidebarListItemSettingsLink.displayName = 'SidebarListItemSettingsLink';

export default SidebarListItemSettingsLink;
