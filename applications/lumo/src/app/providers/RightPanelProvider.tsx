import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { useIsLumoSmallScreen } from '../hooks/useIsLumoSmallScreen';

interface RightPanelContextValue {
    isOpen: boolean;
    isSmallScreen: boolean;
    isOverlay: boolean;
    toggle: () => void;
    open: () => void;
    close: () => void;
    closeOnItemClick: () => void;
    contentEl: HTMLElement | null;
    registerContentEl: (el: HTMLElement | null) => void;
}

const RightPanelContext = createContext<RightPanelContextValue | null>(null);

export const RightPanelProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
    const { isSmallScreen } = useIsLumoSmallScreen();

    const toggle = useCallback(() => setIsOpen((v) => !v), []);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const registerContentEl = useCallback((el: HTMLElement | null) => setContentEl(el), []);

    // Context-aware item click handler - only closes on mobile
    const closeOnItemClick = useCallback(() => {
        if (!isSmallScreen) {
            return;
        }
        setIsOpen(false);
    }, [isSmallScreen]);

    // On small screens, the drawer becomes an overlay
    const isOverlay = isSmallScreen && isOpen;

    return (
        <RightPanelContext.Provider
            value={{
                isOpen,
                isSmallScreen,
                isOverlay,
                toggle,
                open,
                close,
                closeOnItemClick,
                contentEl,
                registerContentEl,
            }}
        >
            {children}
        </RightPanelContext.Provider>
    );
};

export const useRightPanel = (): RightPanelContextValue => {
    const ctx = useContext(RightPanelContext);
    if (!ctx) {
        throw new Error('useRightPanel must be used within RightPanelProvider');
    }
    return ctx;
};
