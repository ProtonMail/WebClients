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
    title: string | null;
    actionButton: ReactNode | null;
    setHeaderContent: (title: string | null, actionButton?: ReactNode | null) => void;
}

const RightPanelContext = createContext<RightPanelContextValue | null>(null);

export const RightPanelProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
    const [title, setTitle] = useState<string | null>(null);
    const [actionButton, setActionButton] = useState<ReactNode | null>(null);
    const { isSmallScreen } = useIsLumoSmallScreen();

    const toggle = useCallback(() => setIsOpen((v) => !v), []);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const registerContentEl = useCallback((el: HTMLElement | null) => setContentEl(el), []);

    const setHeaderContent = useCallback((newTitle: string | null, newActionButton?: ReactNode | null) => {
        setTitle(newTitle);
        setActionButton(newActionButton || null);
    }, []);

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
                title,
                actionButton,
                setHeaderContent,
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
