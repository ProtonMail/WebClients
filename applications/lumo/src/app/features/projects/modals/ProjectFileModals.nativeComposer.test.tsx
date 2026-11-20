import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { ConfirmRemoveAllFilesModal } from './ConfirmRemoveAllFilesModal';
import { LinkDriveFolderModal } from './LinkDriveFolderModal';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('../../../components/Files', () => ({ DriveBrowser: () => null }));
vi.mock('../../../hooks/useDriveSDK', () => ({ useDriveSDK: () => ({ isInitialized: false }) }));
vi.mock('../../../hooks/useDriveFolderIndexing', () => ({
    MAX_INDEXABLE_FILES: 300,
    useDriveFolderIndexing: () => ({ indexFolder: vi.fn(), removeIndexedFoldersBySpace: vi.fn() }),
}));
vi.mock('../../../redux/hooks', () => ({
    useLumoDispatch: () => vi.fn(),
    useLumoSelector: (select: (state: unknown) => unknown) => select({ spaces: {}, attachments: {} }),
}));
vi.mock('../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../../providers/RightPanelProvider', () => ({
    useOptionalRightPanel: () => ({ isOpen: true, isOverlay: false }),
}));
vi.mock('../../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: false }) }));
vi.mock('../../../remote/nativeComposerBridgeHelpers');
vi.mock('../../../util/userAgent', () => ({
    canShowWebComposer: () => false,
    canUseNativeSidebarLayout: () => true,
    canUseNativeRightPanelLayout: () => true,
}));

beforeEach(() => vi.clearAllMocks());

it('covers the fitted composer while the Drive folder dialog is open and restores it on close', () => {
    const props = { projectId: 'project', onClose: vi.fn(), onExit: vi.fn() };
    const { rerender } = render(<LinkDriveFolderModal {...props} open />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(<LinkDriveFolderModal {...props} open={false} />);

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});

it('covers the fitted composer while confirming file removal and restores it on close', () => {
    const props = { fileCount: 1, onClose: vi.fn(), onConfirm: vi.fn() };
    const { rerender } = render(<ConfirmRemoveAllFilesModal {...props} open />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(<ConfirmRemoveAllFilesModal {...props} open={false} />);

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});
