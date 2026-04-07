import { createContext, useContext } from 'react';

interface SidebarContextValue {
    openId: string | null;
    setOpenId: (id: string | null) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error('useSidebarContext must be used within <SidebarRoot>');
    }
    return ctx;
}
