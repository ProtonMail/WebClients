import type { ReactNode } from 'react';

import { SidebarListItemLink } from '@proton/components/index';

export function OptionalItemLink({ to, children }: { to?: string; children: ReactNode }) {
    if (!to) {
        return children;
    }
    return (
        <SidebarListItemLink to={to} className="my-0.5">
            {children}
        </SidebarListItemLink>
    );
}
