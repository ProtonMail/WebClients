import { renderHook } from '@testing-library/react';

import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useSidebar } from '../../../providers/SidebarProvider';
import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { canUseNativeSidebarLayout } from '../../../util/userAgent';
import { useNativeComposerVisibilityApi } from './useNativeComposerVisibilityApi';

jest.mock('../../../hooks/useLumoFlags');
jest.mock('../../../providers/SidebarProvider');
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../util/userAgent');
jest.mock('@proton/components', () => ({ useActiveBreakpoint: jest.fn() }));

const mockedUseLumoFlags = useLumoFlags as jest.Mock;
const mockedUseSidebar = useSidebar as jest.Mock;
const mockedCanUseNativeSidebarLayout = canUseNativeSidebarLayout as jest.Mock;

describe('useNativeComposerVisibilityApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseLumoFlags.mockReturnValue({ nativeComposer: true });
    });

    it('shows the native composer on a large screen with the sidebar expanded', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: true, isSmallScreen: false });
        mockedCanUseNativeSidebarLayout.mockReturnValue(true);

        renderHook(() => useNativeComposerVisibilityApi());

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
    });

    it('shows the native composer on a large screen with the sidebar collapsed', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: false, isSmallScreen: false });
        mockedCanUseNativeSidebarLayout.mockReturnValue(true);

        renderHook(() => useNativeComposerVisibilityApi());

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
    });

    it('keeps the legacy behavior for clients without sidebar support', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: false, isSmallScreen: false });
        mockedCanUseNativeSidebarLayout.mockReturnValue(false);

        renderHook(() => useNativeComposerVisibilityApi());

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    });

    it('falls back to showing the composer for pre-2.0.4 clients when the sidebar is visible', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: true, isSmallScreen: false });
        mockedCanUseNativeSidebarLayout.mockReturnValue(false);

        renderHook(() => useNativeComposerVisibilityApi());

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
    });

    it('hides the native composer on a small screen while the drawer is open', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: true, isSmallScreen: true });
        mockedCanUseNativeSidebarLayout.mockReturnValue(true);

        renderHook(() => useNativeComposerVisibilityApi());

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    });

    it('shows the native composer on a small screen with the drawer closed', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: false, isSmallScreen: true });
        mockedCanUseNativeSidebarLayout.mockReturnValue(true);

        renderHook(() => useNativeComposerVisibilityApi());

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
    });

    it('hides the native composer while a blocking overlay is mounted on a large screen', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: true, isSmallScreen: false });
        mockedCanUseNativeSidebarLayout.mockReturnValue(true);

        renderHook(() => useNativeComposerVisibilityApi({ isBlocking: true }));

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    });

    it('restores the native composer when the blocking overlay unmounts', () => {
        mockedUseSidebar.mockReturnValue({ isVisible: true, isSmallScreen: false });
        mockedCanUseNativeSidebarLayout.mockReturnValue(true);

        const { unmount } = renderHook(() => useNativeComposerVisibilityApi({ isBlocking: true }));
        unmount();

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
    });
});
