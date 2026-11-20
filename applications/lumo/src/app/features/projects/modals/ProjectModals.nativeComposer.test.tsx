import { render } from '@testing-library/react';

import { useOptionalRightPanel } from '../../../providers/RightPanelProvider';
import { useOptionalSidebar } from '../../../providers/SidebarProvider';
import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { type ProjectSpace, type SpaceKeyClear, SpaceType } from '../../../types';
import { ProjectLimitModal } from './ProjectLimitModal';
import { ProjectSearchModal } from './ProjectSearchModal';

vi.mock('@proton/components/containers/payments/subscription/subscriptionModalContext', () => ({
    useSubscriptionModal: () => [vi.fn(), false],
}));
vi.mock('@proton/payments-hooks/ui/hooks/usePreferredPlansMap', () => ({
    usePreferredPlansMap: () => ({ plansMapLoading: false }),
}));
vi.mock('../../../hooks', () => ({ useLumoUserSettings: () => ({ lumoUserSettings: {} }) }));
vi.mock('../../../redux/hooks', () => ({ useLumoDispatch: () => vi.fn() }));
vi.mock('../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../../providers/RightPanelProvider', () => ({ useOptionalRightPanel: vi.fn() }));
vi.mock('../../../providers/SidebarProvider', () => ({ useOptionalSidebar: vi.fn() }));
vi.mock('../../../remote/nativeComposerBridgeHelpers');
vi.mock('../../../util/userAgent', () => ({
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
    vi.clearAllMocks();
    vi.mocked(useOptionalSidebar).mockReturnValue({ isVisible: false } as ReturnType<typeof useOptionalSidebar>);
    vi.mocked(useOptionalRightPanel).mockReturnValue({
        isOpen: true,
        isOverlay: false,
    } as ReturnType<typeof useOptionalRightPanel>);
});

it('hides the fitted composer for project access settings and restores it when the dialog closes', () => {
    const props = { space, onClose: vi.fn(), onExit: vi.fn() };
    const { rerender } = render(<ProjectSearchModal {...props} open />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(<ProjectSearchModal {...props} open={false} />);

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});

it('keeps the composer hidden when access settings close between two open sidebars', () => {
    vi.mocked(useOptionalSidebar).mockReturnValue({ isVisible: true } as ReturnType<typeof useOptionalSidebar>);
    const { unmount } = render(<ProjectSearchModal space={space} open onClose={vi.fn()} onExit={vi.fn()} />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
    vi.mocked(setNativeComposerVisibility).mockClear();

    unmount();

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);
});

it('hides the composer behind the project-limit upsell and restores it on close', () => {
    vi.mocked(useOptionalRightPanel).mockReturnValue({
        isOpen: false,
        isOverlay: false,
    } as ReturnType<typeof useOptionalRightPanel>);
    vi.mocked(useOptionalSidebar).mockReturnValue({ isVisible: true } as ReturnType<typeof useOptionalSidebar>);
    const props = { onClose: vi.fn(), onExit: vi.fn() };
    const { rerender } = render(<ProjectLimitModal {...props} open />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(<ProjectLimitModal {...props} open={false} />);

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});
