import { renderHook } from '@testing-library/react';

import { useLumoFlags } from '../../../hooks/useLumoFlags';
import '../../../remote/nativeComposerBridge';
import { useNativeComposerHostVisibilityApi, useNativeComposerVisibilityApi } from './useNativeComposerVisibilityApi';

jest.mock('../../../hooks/useLumoFlags');
jest.mock('../../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: true }) }));
jest.mock('../../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: false }) }));
jest.mock('../../../providers/RightPanelProvider', () => ({ useOptionalRightPanel: () => ({ isOverlay: false }) }));

const api = () => (window as any).nativeComposerApiInstance;

describe('native composer selection sent by its host', () => {
    it('keeps native input hidden when the feature flag changes, including behind a covering modal', () => {
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)',
        });
        (useLumoFlags as jest.Mock).mockReturnValue({ nativeComposer: true });
        const host = renderHook(() => useNativeComposerHostVisibilityApi());
        const modal = renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
        expect(api().getState().isVisible).toBe(false);

        (useLumoFlags as jest.Mock).mockReturnValue({ nativeComposer: false });
        host.rerender();
        modal.rerender();
        modal.unmount();

        expect(api().getState().isVisible).toBe(false);
        expect(host.result.current.showWebComposer()).toBe(true);
    });

    it.each([
        ['iPad 2.2.0', 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)', true, true],
        ['older iPad', 'ProtonLumo/2.1.3 (iPadOS 27.2; Apple iPad)', true, false],
        ['iPhone 2.2.0', 'ProtonLumo/2.2.0 (iOS 27.2; Apple iPhone)', true, true],
        ['existing iPhone', 'ProtonLumo/2.1.1 (iOS 27.2; Apple iPhone)', true, true],
        ['Android', 'ProtonLumo/2.1.0 (Android 16; Pixel)', true, true],
        ['flag disabled', 'ProtonLumo/2.2.0 (iPadOS 27.2; Apple iPad)', false, false],
        ['browser', 'Mozilla/5.0', true, false],
    ])('uses one composer for %s', (_name, userAgent, enabled, native) => {
        Object.defineProperty(navigator, 'userAgent', { configurable: true, value: userAgent });
        (useLumoFlags as jest.Mock).mockReturnValue({ nativeComposer: enabled });
        api().toggleComposerVisibility(false);

        const { result } = renderHook(() => useNativeComposerHostVisibilityApi());

        expect(Object.keys(api().getState()).sort()).toEqual(
            [
                'attachedFiles',
                'availableAspectRatios',
                'customLumos',
                'editMode',
                'featureFlags',
                'isCreateImageEnabled',
                'isGhostModeEnabled',
                'isMaxModelAvailable',
                'isSmallScreen',
                'isVisible',
                'isWebSearchEnabled',
                'lumoMode',
                'maxModelAvailability',
                'model',
                'modelTier',
                'responseMode',
                'selectedAspectRatio',
                'selectedCustomLumo',
                'showTsAndCs',
                'sidebar',
                'skills',
                'userFlags',
            ].sort()
        );
        expect(api().getState().isVisible).toBe(native);
        expect(result.current.showWebComposer()).toBe(!native);
    });
});
