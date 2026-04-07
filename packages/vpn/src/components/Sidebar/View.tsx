import { useState } from 'react';

import { SidebarList } from '@proton/components/index';
import type { NavItemResolved } from '@proton/nav/types/nav';

import { SidebarContext } from './Context';

interface SidebarProps {
    items: NavItemResolved[];
    children: (item: NavItemResolved) => React.ReactNode;
}

export function SidebarView({ items, children }: SidebarProps) {
    const openItem = items.find((item) => !!item.meta.open)?.id ?? null;
    const [openId, setOpenId] = useState<string | null>(openItem);

    return (
        <SidebarContext.Provider value={{ openId, setOpenId }}>
            <SidebarList className="flex flex-column gap-3">{items.map((item) => children(item))}</SidebarList>
        </SidebarContext.Provider>
    );
}
