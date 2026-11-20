import { createRef } from 'react';

import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { useNativeComposerHostVisibilityApi } from '../../Composer/hooks/useNativeComposerVisibilityApi';
import { FilesManagementView } from './FilesManagementView';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('../../../redux/hooks', () => ({
    useLumoDispatch: () => vi.fn(),
    useLumoSelector: (select: (state: unknown) => unknown) =>
        select({ spaces: {}, attachments: {}, messages: {}, contextFilters: [] }),
    useLumoMemoSelector: () => ({}),
}));
vi.mock('./ContextUsageBreakdown', () => ({ ContextUsageBreakdown: () => null }));
vi.mock('../../../providers/IsGuestProvider', () => ({ useIsGuest: () => false }));
vi.mock('../../Composer/hooks/useFileHandling', () => ({ useFileHandling: () => ({}) }));
vi.mock('../../Composer/ExcelSheetSelectionModal', () => ({
    useExcelSheetSelection: () => ({ requestSheetSelection: vi.fn(), modal: null }),
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

const ComposerHost = () => {
    useNativeComposerHostVisibilityApi();
    return null;
};

beforeEach(() => vi.clearAllMocks());

it('keeps the composer fitted beside docked chat files', () => {
    render(
        <>
            <ComposerHost />
            <FilesManagementView messageChain={[]} filesContainerRef={createRef()} onClose={vi.fn()} />
        </>
    );

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});

it('covers the composer when chat files are presented as a modal and restores fitting on close', () => {
    const props = { messageChain: [], filesContainerRef: createRef<HTMLDivElement>(), onClose: vi.fn() };
    const { rerender } = render(
        <>
            <ComposerHost />
            <FilesManagementView
                {...props}
                forceModal
                modalProps={{ open: true, onClose: props.onClose, onExit: vi.fn() }}
            />
        </>
    );
    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    rerender(
        <>
            <ComposerHost />
            <FilesManagementView
                {...props}
                forceModal
                modalProps={{ open: false, onClose: props.onClose, onExit: vi.fn() }}
            />
        </>
    );

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});
