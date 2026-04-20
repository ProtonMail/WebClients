import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './styles.scss';

export interface SidebarRootProps {
    children: ReactNode;
    className?: string;
}

function Root({ children, className }: SidebarRootProps) {
    return (
        <nav aria-label="navigation" className={clsx('rounded px-3 flex flex-column gap-3', className)}>
            {children}
        </nav>
    );
}
Root.displayName = 'Sidebar.Root';

export { Root };
