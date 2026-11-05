import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { ConfirmRemoveAllFilesModal } from './ConfirmRemoveAllFilesModal';
import { LinkDriveFolderModal } from './LinkDriveFolderModal';

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('../../../components/Files', () => ({ DriveBrowser: () => null }));
jest.mock('../../../hooks/useDriveSDK', () => ({ useDriveSDK: () => ({ isInitialized: false }) }));
jest.mock('../../../hooks/useDriveFolderIndexing', () => ({
    MAX_INDEXABLE_FILES: 300,
    useDriveFolderIndexing: () => ({ indexFolder: jest.fn(), removeIndexedFoldersBySpace: jest.fn() }),
}));
jest.mock('../../../redux/hooks', () => ({
    useLumoDispatch: () => jest.fn(),
    useLumoSelector: (select: (state: unknown) => unknown) => select({ spaces: {}, attachments: {} }),
}));
jest.mock('../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
jest.mock('../../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
jest.mock('../../../providers/RightPanelProvider', () => ({
    useOptionalRightPanel: () => ({ isOpen: true, isOverlay: false }),
}));
jest.mock('../../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: false }) }));
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../util/userAgent', () => ({
    canShowWebComposer: () => false,
    canUseNativeSidebarLayout: () => true,
    canUseNativeRightPanelLayout: () => true,
}));

beforeEach(() => jest.clearAllMocks());

it('covers the fitted composer while the Drive folder dialog is open and restores it on close', () => {
    const props = { projectId: 'project', onClose: jest.fn(), onExit: jest.fn() };
    const { rerender } = render(<LinkDriveFolderModal {...props} open />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(<LinkDriveFolderModal {...props} open={false} />);

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});

it('covers the fitted composer while confirming file removal and restores it on close', () => {
    const props = { fileCount: 1, onClose: jest.fn(), onConfirm: jest.fn() };
    const { rerender } = render(<ConfirmRemoveAllFilesModal {...props} open />);
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(<ConfirmRemoveAllFilesModal {...props} open={false} />);

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});
