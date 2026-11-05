import { render, renderHook } from '@testing-library/react';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { ImagePreviewOverlay } from './ImagePreviewOverlay';

jest.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
jest.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../remote/nativeComposerBridgeHelpers');
jest.mock('../../util/userAgent', () => ({ canShowWebComposer: () => false, canUseNativeSidebarLayout: () => true }));

it('does not uncover the composer when a closed image preview mounts beneath another cover', () => {
    renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
    jest.mocked(setNativeComposerVisibility).mockClear();

    render(<ImagePreviewOverlay isOpen={false} imageDataUrl="" onClose={jest.fn()} />);

    expect(setNativeComposerVisibility).not.toHaveBeenCalled();
});
