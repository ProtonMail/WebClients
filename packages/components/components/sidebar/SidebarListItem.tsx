import type { LiHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends LiHTMLAttributes<HTMLLIElement> {
    itemClassName?: string;
}

const SidebarListItem = forwardRef<HTMLLIElement, Props>(
    ({ className = '', itemClassName = 'navigation-item w-full px-3 mb-0.5', children, ...rest }, ref) => {
        return (
            <li className={clsx([itemClassName, className])} ref={ref} {...rest}>
                {children}
            </li>
        );
    }
);

SidebarListItem.displayName = 'SidebarListItem';

export const SubSidebarListItem = forwardRef<HTMLLIElement, Props>((props, ref) => {
    return <SidebarListItem itemClassName="navigation-subitem" ref={ref} {...props} />;
});

SubSidebarListItem.displayName = 'SubSidebarListItem';

export default SidebarListItem;
