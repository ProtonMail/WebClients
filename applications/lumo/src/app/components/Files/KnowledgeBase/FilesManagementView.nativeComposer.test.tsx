import { createRef } from 'react';

import { render } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';
import { useNativeComposerHostVisibilityApi } from '../../Composer/hooks/useNativeComposerVisibilityApi';
import { FilesManagementView } from './FilesManagementView';

jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('../../../redux/hooks', () => ({
    useLumoDispatch: () => jest.fn(),
    useLumoSelector: (select: (state: unknown) => unknown) =>
        select({ spaces: {}, attachments: {}, messages: {}, contextFilters: [] }),
    useLumoMemoSelector: () => ({}),
}));
jest.mock('./ContextUsageBreakdown', () => ({ ContextUsageBreakdown: () => null }));
jest.mock('../../../providers/IsGuestProvider', () => ({ useIsGuest: () => false }));
jest.mock('../../Composer/hooks/useFileHandling', () => ({ useFileHandling: () => ({}) }));
jest.mock('../../Composer/ExcelSheetSelectionModal', () => ({
    useExcelSheetSelection: () => ({ requestSheetSelection: jest.fn(), modal: null }),
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

const ComposerHost = () => {
    useNativeComposerHostVisibilityApi();
    return null;
};

beforeEach(() => jest.clearAllMocks());

it('keeps the composer fitted beside docked chat files', () => {
    render(
        <>
            <ComposerHost />
            <FilesManagementView messageChain={[]} filesContainerRef={createRef()} onClose={jest.fn()} />
        </>
    );

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});

it('covers the composer when chat files are presented as a modal and restores fitting on close', () => {
    const props = { messageChain: [], filesContainerRef: createRef<HTMLDivElement>(), onClose: jest.fn() };
    const { rerender } = render(
        <>
            <ComposerHost />
            <FilesManagementView
                {...props}
                forceModal
                modalProps={{ open: true, onClose: props.onClose, onExit: jest.fn() }}
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
                modalProps={{ open: false, onClose: props.onClose, onExit: jest.fn() }}
            />
        </>
    );

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});
