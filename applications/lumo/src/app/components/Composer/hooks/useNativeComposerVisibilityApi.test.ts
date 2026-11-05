import { createElement } from 'react';

import { act, renderHook } from '@testing-library/react';

import { useNativeComposerProjectDetailVisibilityApi } from '../../../features/projects/hooks/useNativeComposerProjectDetailVisibilityApi';
import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { ArtifactPanelHostProvider, useArtifactPanelHostActions } from '../../../providers/ArtifactPanelHostProvider';
import { useOptionalRightPanel } from '../../../providers/RightPanelProvider';
import { useOptionalSidebar } from '../../../providers/SidebarProvider';
import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import type * as UserAgent from '../../../util/userAgent';
import { canShowWebComposer, canUseNativeRightPanelLayout, canUseNativeSidebarLayout } from '../../../util/userAgent';
import { useNativeComposerHostVisibilityApi, useNativeComposerVisibilityApi } from './useNativeComposerVisibilityApi';

jest.mock('../../../hooks/useLumoFlags');
jest.mock('../../../hooks/useIsLumoSmallScreen');
jest.mock('../../../providers/SidebarProvider');
jest.mock('../../../providers/RightPanelProvider');
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../util/userAgent');
jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({ __esModule: true, default: jest.fn() }));

const mockedUseLumoFlags = useLumoFlags as jest.Mock;
const mockedUseOptionalSidebar = useOptionalSidebar as jest.Mock;
const mockedUseOptionalRightPanel = useOptionalRightPanel as jest.Mock;
const mockedUseIsLumoSmallScreen = useIsLumoSmallScreen as jest.Mock;

/** `null` stands for a route rendered outside the sidebar layout, which has no provider. */
const givenSidebar = (sidebar: { isVisible: boolean; isSmallScreen: boolean } | null) => {
    mockedUseOptionalSidebar.mockReturnValue(sidebar);
    mockedUseIsLumoSmallScreen.mockReturnValue({ isSmallScreen: sidebar?.isSmallScreen ?? false });
};
/** Model both the open state and the small-screen-only overlay state. */
const givenRightPanel = (rightPanel: { isOpen: boolean; isOverlay: boolean } | null) => {
    mockedUseOptionalRightPanel.mockReturnValue(rightPanel);
};
const mockedCanUseNativeSidebarLayout = canUseNativeSidebarLayout as jest.Mock;

describe('useNativeComposerVisibilityApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (canUseNativeRightPanelLayout as jest.Mock).mockReturnValue(false);
        mockedUseLumoFlags.mockReturnValue({ nativeComposer: true });
        (canShowWebComposer as jest.Mock).mockImplementation((enabled: boolean) => !enabled);
        givenRightPanel({ isOpen: false, isOverlay: false });
    });

    it('keeps the composer hidden when project instructions close over an open knowledge panel', () => {
        givenSidebar({ isVisible: false, isSmallScreen: true });
        givenRightPanel({ isOpen: true, isOverlay: true });
        mockedCanUseNativeSidebarLayout.mockReturnValue(true);
        const { rerender } = renderHook(({ open }) => useNativeComposerProjectDetailVisibilityApi(open), {
            initialProps: { open: true },
        });

        rerender({ open: false });

        expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    });

    it.each([false, true])(
        'restores layout visibility after closing a docked artifact (knowledge open: %s)',
        (isKnowledgeOpen) => {
            givenSidebar({ isVisible: false, isSmallScreen: false });
            givenRightPanel({ isOpen: isKnowledgeOpen, isOverlay: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);
            const { result } = renderHook(
                () => {
                    useNativeComposerHostVisibilityApi();
                    return useArtifactPanelHostActions();
                },
                { wrapper: ({ children }) => createElement(ArtifactPanelHostProvider, null, children) }
            );

            act(() => result.current.setHostVisible(true));

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

            act(() => result.current.setHostVisible(false));

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(!isKnowledgeOpen);
        }
    );

    it.each([false, true])(
        'fits beside a docked artifact only when the left sidebar is closed (left sidebar: %s)',
        (isVisible) => {
            givenSidebar({ isVisible, isSmallScreen: false });
            givenRightPanel({ isOpen: false, isOverlay: false });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);
            (canUseNativeRightPanelLayout as jest.Mock).mockReturnValue(true);
            const { result } = renderHook(
                () => {
                    useNativeComposerHostVisibilityApi();
                    return useArtifactPanelHostActions();
                },
                { wrapper: ({ children }) => createElement(ArtifactPanelHostProvider, null, children) }
            );

            act(() => result.current.setHostVisible(true));

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(!isVisible);
        }
    );

    describe('Android tablets without right-panel fitting', () => {
        const originalUserAgent = Object.getOwnPropertyDescriptor(navigator, 'userAgent');

        beforeEach(() => {
            const actualUserAgent = jest.requireActual<typeof UserAgent>('../../../util/userAgent');
            jest.mocked(canUseNativeSidebarLayout).mockImplementation(actualUserAgent.canUseNativeSidebarLayout);
            jest.mocked(canUseNativeRightPanelLayout).mockImplementation(actualUserAgent.canUseNativeRightPanelLayout);
        });

        afterEach(() => {
            if (originalUserAgent) {
                Object.defineProperty(navigator, 'userAgent', originalUserAgent);
            } else {
                Reflect.deleteProperty(navigator, 'userAgent');
            }
        });

        it.each([
            ['2.0.4', 'artifact'],
            ['2.2.0', 'artifact'],
            ['2.0.4', 'files'],
            ['2.2.0', 'files'],
        ])('hides the composer on Android %s beside docked %s and restores it on close', (version, panel) => {
            Object.defineProperty(navigator, 'userAgent', {
                value: `ProtonLumo/${version} (Android 16; Pixel Tablet)`,
                configurable: true,
            });
            givenSidebar({ isVisible: false, isSmallScreen: false });
            const { result, rerender } = renderHook(
                () => {
                    useNativeComposerHostVisibilityApi();
                    return useArtifactPanelHostActions();
                },
                { wrapper: ({ children }) => createElement(ArtifactPanelHostProvider, null, children) }
            );
            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);

            act(() => {
                if (panel === 'artifact') {
                    result.current.setHostVisible(true);
                } else {
                    givenRightPanel({ isOpen: true, isOverlay: false });
                    rerender();
                }
            });
            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

            act(() => {
                result.current.setHostVisible(false);
                givenRightPanel({ isOpen: false, isOverlay: false });
                rerender();
            });
            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });
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

        it.each([false, true])(
            'fits beside a docked knowledge panel only with the left sidebar closed (left sidebar: %s)',
            (isVisible) => {
                givenSidebar({ isVisible, isSmallScreen: false });
                givenRightPanel({ isOpen: true, isOverlay: false });
                mockedCanUseNativeSidebarLayout.mockReturnValue(true);
                (canUseNativeRightPanelLayout as jest.Mock).mockReturnValue(true);

                renderHook(() => useNativeComposerHostVisibilityApi());

                expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(!isVisible);
            }
        );

        it('hides the native composer while the right panel overlays the screen', () => {
            givenSidebar({ isVisible: false, isSmallScreen: true });
            givenRightPanel({ isOpen: true, isOverlay: true });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            renderHook(() => useNativeComposerHostVisibilityApi());

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
        });

        it('brings the native composer back when the right panel closes', () => {
            givenSidebar({ isVisible: false, isSmallScreen: true });
            givenRightPanel({ isOpen: true, isOverlay: true });
            mockedCanUseNativeSidebarLayout.mockReturnValue(true);

            const { rerender } = renderHook(() => useNativeComposerHostVisibilityApi());

            givenRightPanel({ isOpen: false, isOverlay: false });
            rerender();

            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
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

        it('keeps the composer hidden while an outer cover is still open', () => {
            const outer = renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
            const inner = renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));

            inner.unmount();
            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

            outer.unmount();
            expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
        });

        it('stops the composer host from uncovering the composer while something covers it', () => {
            renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
            renderHook(() => useNativeComposerHostVisibilityApi());

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
