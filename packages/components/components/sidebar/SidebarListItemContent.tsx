import type { HTMLAttributes, ReactNode } from 'react';

import { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLSpanElement> {
    icon?: IconName;
    iconColor?: string;
    children?: ReactNode;
    title?: string;
    left?: ReactNode;
    right?: ReactNode;
    collapsed?: boolean;
}

const SidebarListItemContent = ({ left, right, children, collapsed, ...rest }: Props) => {
    return (
        <span className={clsx('flex flex-nowrap w-full items-center', !collapsed && 'gap-2')} {...rest}>
            {left}
            <span className={clsx('flex-1 max-w-full flex items-center flex-nowrap gap-2', collapsed && 'sr-only')}>
                {children}
            </span>
            {right && <span className="flex *:min-size-auto items-center">{right}</span>}
        </span>
    );
};

export default SidebarListItemContent;
