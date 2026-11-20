import { render, renderHook } from '@testing-library/react';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { ImagePreviewOverlay } from './ImagePreviewOverlay';

vi.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../remote/nativeComposerBridgeHelpers');
vi.mock('../../util/userAgent', () => ({ canShowWebComposer: () => false, canUseNativeSidebarLayout: () => true }));

it('does not uncover the composer when a closed image preview mounts beneath another cover', () => {
    renderHook(() => useNativeComposerVisibilityApi({ hideComposer: true }));
    vi.mocked(setNativeComposerVisibility).mockClear();

    render(<ImagePreviewOverlay isOpen={false} imageDataUrl="" onClose={vi.fn()} />);

    expect(setNativeComposerVisibility).not.toHaveBeenCalled();
});
