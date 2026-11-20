import { fireEvent, render, screen } from '@testing-library/react';

import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';
import { useExcelSheetSelection } from './ExcelSheetSelectionModal';
import { useNativeComposerHostVisibilityApi } from './hooks/useNativeComposerVisibilityApi';

vi.mock('../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ nativeComposer: true }) }));
vi.mock('../../hooks/useIsLumoSmallScreen', () => ({ useIsLumoSmallScreen: () => ({ isSmallScreen: false }) }));
vi.mock('../../providers/RightPanelProvider', () => ({
    useOptionalRightPanel: () => ({ isOpen: true, isOverlay: false }),
}));
vi.mock('../../providers/SidebarProvider', () => ({ useOptionalSidebar: () => ({ isVisible: false }) }));
vi.mock('../../remote/nativeComposerBridgeHelpers');
vi.mock('../../util/userAgent', () => ({
    canShowWebComposer: () => false,
    canUseNativeSidebarLayout: () => true,
    canUseNativeRightPanelLayout: () => true,
}));

const SheetSelection = () => {
    useNativeComposerHostVisibilityApi();
    const { requestSheetSelection, modal } = useExcelSheetSelection();
    return (
        <>
            <button
                onClick={() => {
                    void requestSheetSelection(new File([], 'workbook.xlsx'), [
                        { name: 'First', index: 0, rowCount: 1 },
                        { name: 'Second', index: 1, rowCount: 1 },
                    ]);
                }}
            >
                Choose sheets
            </button>
            {modal}
        </>
    );
};

it('covers the fitted composer during sheet selection and restores it after cancellation', () => {
    render(<SheetSelection />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose sheets' }));

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel', hidden: true }));

    expect(setNativeComposerVisibility).toHaveBeenLastCalledWith(true);
});
