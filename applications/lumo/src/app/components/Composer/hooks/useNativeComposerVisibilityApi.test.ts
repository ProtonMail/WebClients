import { renderHook } from '@testing-library/react';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useOptionalSidebar } from '../../../providers/SidebarProvider';
import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { canUseNativeSidebarLayout } from '../../../util/userAgent';
import { useNativeComposerHostVisibilityApi, useNativeComposerVisibilityApi } from './useNativeComposerVisibilityApi';

jest.mock('../../../hooks/useLumoFlags');
jest.mock('../../../hooks/useIsLumoSmallScreen');
jest.mock('../../../providers/SidebarProvider');
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../util/userAgent');
jest.mock('@proton/components', () => ({ useActiveBreakpoint: jest.fn() }));

const mockedUseLumoFlags = useLumoFlags as jest.Mock;
const mockedUseOptionalSidebar = useOptionalSidebar as jest.Mock;
const mockedUseIsLumoSmallScreen = useIsLumoSmallScreen as jest.Mock;

/** `null` stands for a route rendered outside the sidebar layout, which has no provider. */
const givenSidebar = (sidebar: { isVisible: boolean; isSmallScreen: boolean } | null) => {
    mockedUseOptionalSidebar.mockReturnValue(sidebar);
    mockedUseIsLumoSmallScreen.mockReturnValue({ isSmallScreen: sidebar?.isSmallScreen ?? false });
};
const mockedCanUseNativeSidebarLayout = canUseNativeSidebarLayout as jest.Mock;

describe('useNativeComposerVisibilityApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseLumoFlags.mockReturnValue({ nativeComposer: true });
    });

    describe('the composer itself', () => {
        it('shows the native composer on a large screen with the sidebar expanded', () => {
            givenSidebar({ isVisible: true, isSmallScreen: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('shows the native composer on a large screen with the sidebar collapsed', () => {
            givenSidebar({ isVisible: false, isSmallScreen: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('keeps the legacy behavior for clients without sidebar support', () => {
            givenSidebar({ isVisible: false, isSmallScreen: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(false);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });

        it('falls back to showing the composer for pre-2.0.4 clients when the sidebar is visible', () => {
            givenSidebar({ isVisible: true, isSmallScreen: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(false);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('hides the native composer on a small screen while the drawer is open', () => {
            givenSidebar({ isVisible: true, isSmallScreen: true });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });

        it('shows the native composer on a small screen with the drawer closed', () => {
            givenSidebar({ isVisible: false, isSmallScreen: true });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('hides the native composer when the drawer is opened on a small screen', () => {
            givenSidebar({ isVisible: false, isSmallScreen: true });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            const { rerender } = renderHook(() => useNativeComposerHostVisibilityApi());
            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);

            givenSidebar({ isVisible: true, isSmallScreen: true });
            rerender();

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });

        it('shows the native composer on a route with no sidebar layout at all', () => {
            givenSidebar(null);
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('hides the native composer behind its own modal', () => {
            givenSidebar({ isVisible: true, isSmallScreen: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            renderHook(() => useNativeComposerHostVisibilityApi({ hideComposer: true }));

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });
    });

    describe('anything covering the composer', () => {
        beforeEach(() => {
            givenSidebar({ isVisible: true, isSmallScreen: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);
        });

        it('says nothing to native while it covers nothing', () => {
            renderHook(() => useNativeComposerVisibilityApi({ hideComposer: false }));

            expect(setNativeComposerVisibility).not.toHaveBeenCalled();
        });

        it('hides the native composer once it covers it', () => {
            const { rerender } = renderHook(({ hideComposer }) => useNativeComposerVisibilityApi({ hideComposer }), {
                initialProps: { hideComposer: false },
            });
            rerender({ hideComposer: true });

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });

        it('brings the native composer back once it stops covering it', () => {
            const { rerender } = renderHook(({ hideComposer }) => useNativeComposerVisibilityApi({ hideComposer }), {
                initialProps: { hideComposer: true },
            });
            rerender({ hideComposer: false });

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('restores the native composer when it unmounts', () => {
            const { unmount } = renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
            unmount();

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('leaves the composer hidden when the sidebar drawer still covers the screen', () => {
            givenSidebar({ isVisible: true, isSmallScreen: true });

            const { unmount } = renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
            unmount();

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });

        it('leaves the composer hidden when the native composer is disabled', () => {
            mockedUseLumoFlags.mockReturnValue({ nativeComposer: false });

            const { unmount } = renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
            unmount();

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });
    });
});
