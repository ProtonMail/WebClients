import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useIsLumoSmallScreen } from '../hooks/useIsLumoSmallScreen';
import { setNativeGhostMode } from '../remote/nativeComposerBridgeHelpers';
import { useGhostChat } from './GhostChatProvider';

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

export const SidebarProvider = ({ children, defaultMode = 'collapsed' }: SidebarProviderProps) => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { setGhostChatMode } = useGhostChat();

    // Screen-specific internal states
    const [smallScreenMode, setSmallScreenMode] = useState<SmallScreenMode>('hidden');
    const [largeScreenMode, setLargeScreenMode] = useState<LargeScreenMode>(
        defaultMode === 'hidden' ? 'hidden' : (defaultMode as LargeScreenMode)
    );

    //old implementaiton - need to check
    // const [largeScreenMode, setLargeScreenMode] = useState<LargeScreenMode>(() => {
    //     const fallback: LargeScreenMode = defaultMode === 'hidden' ? 'hidden' : 'expanded';
    //     const stored = readScopedLocalStorageJson<LargeScreenMode | null>(SIDEBAR_MODE_STORAGE_KEY, null);
    //     return stored === 'hidden' || stored === 'expanded' ? stored : fallback;
    // });

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

    const closeOnItemClick = useCallback(() => {
        setGhostChatMode(false);
        setNativeGhostMode(false);
        if (!isSmallScreen) {
            return;
        }
        setSmallScreenMode('hidden');
    }, [isSmallScreen, setGhostChatMode]);

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
