import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

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

interface SidebarState {
    smallScreenMode: SmallScreenMode;
    largeScreenMode: LargeScreenMode;
    animateTransitions: boolean;
    isSmallScreen: boolean;

    toggle: () => void; // Universal toggle (works on all screens)
    closeOverlay: () => void; // Hide overlay sidebar on small screens only
    closeOnItemClick: () => void; // Context-aware item click handler

    isVisible: boolean;
}

const SidebarContext = createContext<SidebarState | null>(null);

interface SidebarProviderProps {
    children: React.ReactNode;
    defaultMode?: LargeScreenMode;
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
    const [animateTransitions, setAnimateTransitions] = useState(false);

    // Breakpoint layout changes should snap; only user actions should animate.
    useLayoutEffect(() => {
        setAnimateTransitions(false);
    }, [isSmallScreen]);

    // Persist large screen mode so the sidebar state survives reloads.
    useEffect(() => {
        writeScopedLocalStorageJson(SIDEBAR_MODE_STORAGE_KEY, largeScreenMode);
    }, [largeScreenMode]);

    const isVisible = isSmallScreen ? smallScreenMode === 'overlay' : largeScreenMode === 'expanded';

    const toggle = useCallback(() => {
        setAnimateTransitions(true);
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
        setAnimateTransitions(true);
        setSmallScreenMode('hidden');
    }, [isSmallScreen]);

    const closeOnItemClick = useCallback(() => {
        setGhostChatMode(false);
        closeOverlay();
    }, [closeOverlay, setGhostChatMode]);

    const value: SidebarState = useMemo(
        () => ({
            smallScreenMode,
            largeScreenMode,
            animateTransitions,
            isSmallScreen,
            toggle,
            closeOverlay,
            closeOnItemClick,
            isVisible,
        }),
        [
            smallScreenMode,
            largeScreenMode,
            animateTransitions,
            isSmallScreen,
            toggle,
            closeOverlay,
            closeOnItemClick,
            isVisible,
        ]
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = (): SidebarState => {
    const context = useOptionalSidebar();
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

/**
 * The sidebar state, or `null` on the full-screen routes that render outside the sidebar layout
 * (the AI paper trail). Only for code that has to work on both — a missing provider there means
 * there is no sidebar, not a bug. Anything inside the layout should use `useSidebar` and let it
 * throw.
 */
export const useOptionalSidebar = (): SidebarState | null => useContext(SidebarContext);
