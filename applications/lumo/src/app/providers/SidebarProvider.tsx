import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useIsLumoSmallScreen } from '../hooks/useIsLumoSmallScreen';
import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from '../util/lumoScopedLocalStorage';
import { useGhostChat } from './GhostChatProvider';

const SIDEBAR_MODE_STORAGE_KEY = 'lumo-sidebar-mode';

/**
 * Small screens (≤768px): 'hidden' | 'overlay'
 *   - hidden: Sidebar not visible
 *   - overlay: Sidebar slides over content with backdrop
 *
 * Large screens (>768px): 'hidden' | 'expanded'
 *   - hidden: Sidebar not visible, content takes full width
 *   - expanded: Full width sidebar with text
 */
type SmallScreenMode = 'hidden' | 'overlay';
type LargeScreenMode = 'hidden' | 'expanded';
type SidebarMode = SmallScreenMode | LargeScreenMode;

interface SidebarState {
    mode: SidebarMode;
    isSmallScreen: boolean;

    toggle: () => void; // Universal toggle (works on all screens)
    closeOverlay: () => void; // Hide overlay sidebar on small screens only
    closeOnItemClick: () => void; // Context-aware item click handler

    isVisible: boolean;
    isExpanded: boolean;
    isOverlay: boolean;
}

const SidebarContext = createContext<SidebarState | null>(null);

interface SidebarProviderProps {
    children: React.ReactNode;
    defaultMode?: SidebarMode;
}

export const SidebarProvider = ({ children, defaultMode = 'expanded' }: SidebarProviderProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { setGhostChatMode } = useGhostChat();

    // Screen-specific internal states
    const [smallScreenMode, setSmallScreenMode] = useState<SmallScreenMode>('hidden');
    const [largeScreenMode, setLargeScreenMode] = useState<LargeScreenMode>(() => {
        const fallback: LargeScreenMode = defaultMode === 'hidden' ? 'hidden' : 'expanded';
        const stored = readScopedLocalStorageJson<LargeScreenMode | null>(SIDEBAR_MODE_STORAGE_KEY, null);
        return stored === 'hidden' || stored === 'expanded' ? stored : fallback;
    });

    // Persist large screen mode so the sidebar state survives reloads.
    useEffect(() => {
        writeScopedLocalStorageJson(SIDEBAR_MODE_STORAGE_KEY, largeScreenMode);
    }, [largeScreenMode]);

    // Compute the effective mode based on screen size
    const mode = useMemo((): SidebarMode => {
        return isSmallScreen ? smallScreenMode : largeScreenMode;
    }, [isSmallScreen, smallScreenMode, largeScreenMode]);

    const toggle = useCallback(() => {
        if (isSmallScreen) {
            setSmallScreenMode((current) => (current === 'hidden' ? 'overlay' : 'hidden'));
        } else {
            setLargeScreenMode((current) => (current === 'hidden' ? 'expanded' : 'hidden'));
        }
    }, [isSmallScreen]);

    const closeOverlay = useCallback(() => {
        if (!isSmallScreen) {
            return;
        }
        setSmallScreenMode('hidden');
    }, [isSmallScreen]);

    const closeOnItemClick = useCallback(() => {
        setGhostChatMode(false);
        closeOverlay();
    }, [closeOverlay, setGhostChatMode]);

    const computedValues = useMemo(() => {
        const isVisible = mode !== 'hidden';
        const isExpanded = mode === 'expanded';
        const isOverlay = mode === 'overlay';

        return {
            isVisible,
            isExpanded,
            isOverlay,
        };
    }, [mode]);

    const value: SidebarState = useMemo(
        () => ({
            mode,
            isSmallScreen,
            toggle,
            closeOverlay,
            closeOnItemClick,
            ...computedValues,
        }),
        [mode, isSmallScreen, toggle, closeOverlay, closeOnItemClick, computedValues]
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = (): SidebarState => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
