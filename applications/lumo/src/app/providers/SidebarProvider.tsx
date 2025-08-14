import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useIsLumoSmallScreen } from '../hooks/useIsLumoSmallScreen';
import { useGhostChat } from './GhostChatProvider';

/**
 * Small screens (≤768px): 'hidden' | 'overlay'
 *   - hidden: Sidebar not visible
 *   - overlay: Sidebar slides over content with backdrop
 *
 * Large screens (>768px): 'collapsed' | 'expanded'
 *   - collapsed: Icons only, narrow width
 *   - expanded: Full width with text
 *   - Note: Large screens can NEVER be hidden
 */
type SmallScreenMode = 'hidden' | 'overlay';
type LargeScreenMode = 'collapsed' | 'expanded';
type SidebarMode = SmallScreenMode | LargeScreenMode;

interface SidebarState {
    mode: SidebarMode;
    isSmallScreen: boolean;

    toggle: () => void; // Universal toggle (works on all screens)
    closeOnItemClick: () => void; // Context-aware item click handler

    isVisible: boolean;
    isCollapsed: boolean;
    isExpanded: boolean;
    isOverlay: boolean;
    shouldShowContent: boolean;
}

const SidebarContext = createContext<SidebarState | null>(null);

interface SidebarProviderProps {
    children: React.ReactNode;
    defaultMode?: SidebarMode;
}

export const SidebarProvider = ({ children, defaultMode = 'collapsed' }: SidebarProviderProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { setGhostChatMode } = useGhostChat();

    // Screen-specific internal states
    const [smallScreenMode, setSmallScreenMode] = useState<SmallScreenMode>('hidden');
    const [largeScreenMode, setLargeScreenMode] = useState<LargeScreenMode>(
        defaultMode === 'hidden' ? 'collapsed' : (defaultMode as LargeScreenMode)
    );

    // Compute the effective mode based on screen size
    const mode = useMemo((): SidebarMode => {
        return isSmallScreen ? smallScreenMode : largeScreenMode;
    }, [isSmallScreen, smallScreenMode, largeScreenMode]);

    const toggle = useCallback(() => {
        if (isSmallScreen) {
            setSmallScreenMode((current) => (current === 'hidden' ? 'overlay' : 'hidden'));
        } else {
            setLargeScreenMode((current) => (current === 'collapsed' ? 'expanded' : 'collapsed'));
        }
    }, [isSmallScreen]);

    const closeOnItemClick = useCallback(() => {
        setGhostChatMode(false);
        if (!isSmallScreen) {
            return;
        }
        setSmallScreenMode('hidden');
    }, [isSmallScreen, setGhostChatMode]);

    const computedValues = useMemo(() => {
        const isVisible = mode !== 'hidden';
        const isCollapsed = mode === 'collapsed';
        const isExpanded = mode === 'expanded';
        const isOverlay = mode === 'overlay';
        const shouldShowContent = isVisible && !isCollapsed;

        return {
            isVisible,
            isCollapsed,
            isExpanded,
            isOverlay,
            shouldShowContent,
        };
    }, [mode]);

    const value: SidebarState = useMemo(
        () => ({
            mode,
            isSmallScreen,
            toggle,
            closeOnItemClick,
            ...computedValues,
        }),
        [mode, isSmallScreen, toggle, closeOnItemClick, computedValues]
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
