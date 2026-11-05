import { render } from '@testing-library/react';

import { useOptionalRightPanel } from '../../../providers/RightPanelProvider';
import { useOptionalSidebar } from '../../../providers/SidebarProvider';
import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { type ProjectSpace, type SpaceKeyClear, SpaceType } from '../../../types';
import { ProjectSearchModal } from './ProjectSearchModal';

jest.mock('../../../hooks', () => ({ useLumoUserSettings: () => ({ lumoUserSettings: {} }) }));
jest.mock('../../../redux/hooks', () => ({ useLumoDispatch: () => jest.fn() }));
jest.mock('../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
jest.mock('../../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../../providers/RightPanelProvider', () => ({ useOptionalRightPanel: jest.fn() }));
jest.mock('../../../providers/SidebarProvider', () => ({ useOptionalSidebar: jest.fn() }));
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../util/userAgent', () => ({
    canShowWebComposer: () => false,
    canUseNativeSidebarLayout: () => true,
    canUseNativeRightPanelLayout: () => true,
}));

const space: ProjectSpace & SpaceKeyClear = {
    id: 'project',
    spaceType: SpaceType.Project,
    createdAt: '2026-11-05T00:00:00Z',
    updatedAt: '2026-11-05T00:00:00Z',
    spaceKey: '',
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useOptionalSidebar).mockReturnValue({ isVisible: false } as ReturnType<typeof useOptionalSidebar>);
    jest.mocked(useOptionalRightPanel).mockReturnValue({
        isOpen: true,
        isOverlay: false,
    } as ReturnType<typeof useOptionalRightPanel>);
});

it('hides the fitted composer for project access settings and restores it when the dialog closes', () => {
    const props = { space, onClose: jest.fn(), onExit: jest.fn() };
    const { rerender } = render(<ProjectSearchModal {...props} open />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(<ProjectSearchModal {...props} open={false} />);

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});

it('keeps the composer hidden when access settings close between two open sidebars', () => {
    jest.mocked(useOptionalSidebar).mockReturnValue({ isVisible: true } as ReturnType<typeof useOptionalSidebar>);
    const { unmount } = render(<ProjectSearchModal space={space} open onClose={jest.fn()} onExit={jest.fn()} />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    jest.mocked(setNativeComposerVisibility).mockClear();

    unmount();

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
});
