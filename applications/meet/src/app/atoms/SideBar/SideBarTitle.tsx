import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface SideBarTitleProps {
    children: ReactNode;
    className?: string;
}

export const SideBarTitle = ({ children, className }: SideBarTitleProps) => {
    return (
        <h2 className={clsx('side-bar-title rounded-sm', className)} tabIndex={-1} data-focus-trap-fallback="0">
            {children}
        </h2>
    );
};
