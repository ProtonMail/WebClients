import React from 'react';

import { renderHook } from '@testing-library/react';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useSidebar } from '../../../providers/SidebarProvider';
import { setNativeSidebarLayout } from '../../../remote/nativeComposerBridgeHelpers';
import { useNativeSidebarLayoutApi } from './useNativeSidebarLayoutApi';

// useIsLumoSmallScreen is automocked below, but automocking still evaluates the real module to
// derive its shape. That module pulls in the full `@proton/components` barrel (drawer, Pass
// integration, dnd-kit, ...), which isn't safe to execute under jsdom. Stub it out so automocking
// stays cheap and doesn't depend on unrelated parts of that barrel loading cleanly.
jest.mock('@proton/components', () => ({ useActiveBreakpoint: jest.fn() }));
jest.mock('../../../hooks/useIsLumoSmallScreen');
jest.mock('../../../providers/SidebarProvider');
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../layouts/sidebar/sidebarMetrics', () => ({
    ...jest.requireActual('../../../layouts/sidebar/sidebarMetrics'),
    readSidebarMetrics: () => ({ expandedWidth: 300, transitionMs: 300 }),
}));

const mockedUseIsLumoSmallScreen = useIsLumoSmallScreen as jest.Mock;
const mockedUseSidebar = useSidebar as jest.Mock;

const setScreen = ({ isSmallScreen, isVisible }: { isSmallScreen: boolean; isVisible: boolean }) => {
    mockedUseIsLumoSmallScreen.mockReturnValue({ isSmallScreen, isMediumScreen: false });
    mockedUseSidebar.mockReturnValue({ isVisible, isSmallScreen });
};

describe('useNativeSidebarLayoutApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('snaps to the expanded width on the first report', () => {
        setScreen({ isSmallScreen: false, isVisible: true });

        renderHook(() => useNativeSidebarLayoutApi());

        expect(setNativeSidebarLayout).toHaveBeenCalledWith({ width: 300, animationDurationMs: 0 });
    });

    it('animates when the user collapses the sidebar', () => {
        setScreen({ isSmallScreen: false, isVisible: true });
        const { rerender } = renderHook(() => useNativeSidebarLayoutApi());

        setScreen({ isSmallScreen: false, isVisible: false });
        rerender();

        expect(setNativeSidebarLayout).toHaveBeenLastCalledWith({ width: 0, animationDurationMs: 300 });
    });

    it('reports nothing on small screens', () => {
        setScreen({ isSmallScreen: true, isVisible: false });

        renderHook(() => useNativeSidebarLayoutApi());

        expect(setNativeSidebarLayout).toHaveBeenCalledWith(null);
    });

    it('snaps rather than animates after crossing back to a large screen', () => {
        setScreen({ isSmallScreen: false, isVisible: true });
        const { rerender } = renderHook(() => useNativeSidebarLayoutApi());

        setScreen({ isSmallScreen: true, isVisible: true });
        rerender();

        setScreen({ isSmallScreen: false, isVisible: true });
        rerender();

        expect(setNativeSidebarLayout).toHaveBeenLastCalledWith({ width: 300, animationDurationMs: 0 });
    });

    it('does not report again when nothing changed', () => {
        setScreen({ isSmallScreen: false, isVisible: true });
        const { rerender } = renderHook(() => useNativeSidebarLayoutApi());

        rerender();

        expect(setNativeSidebarLayout).toHaveBeenCalledTimes(1);
    });

    it('does not animate the phantom second setup React.StrictMode runs on the same instance', () => {
        setScreen({ isSmallScreen: false, isVisible: true });

        // React.StrictMode (dev-only) runs setup -> cleanup -> setup on the same mounted instance,
        // with refs preserved across both setups. Rendering under it here reproduces that, rather
        // than a plain unmount+remount which would give the hook a fresh ref either way.
        renderHook(() => useNativeSidebarLayoutApi(), { wrapper: React.StrictMode });

        // Every push made during mount (including the phantom cleanup/re-setup cycle) must be a
        // snap, never an animated one.
        for (const call of (setNativeSidebarLayout as jest.Mock).mock.calls) {
            const [payload] = call;
            expect(payload?.animationDurationMs ?? 0).toBe(0);
        }
        expect(setNativeSidebarLayout).toHaveBeenLastCalledWith({ width: 300, animationDurationMs: 0 });
    });

    it('pushes null and resets on unmount', () => {
        setScreen({ isSmallScreen: false, isVisible: true });
        const { unmount } = renderHook(() => useNativeSidebarLayoutApi());

        unmount();

        expect(setNativeSidebarLayout).toHaveBeenLastCalledWith(null);
    });

    it('snaps rather than animates on remount after an unmount', () => {
        setScreen({ isSmallScreen: false, isVisible: true });
        const { unmount } = renderHook(() => useNativeSidebarLayoutApi());
        unmount();

        setScreen({ isSmallScreen: false, isVisible: false });
        renderHook(() => useNativeSidebarLayoutApi());

        expect(setNativeSidebarLayout).toHaveBeenLastCalledWith({ width: 0, animationDurationMs: 0 });
    });
});
