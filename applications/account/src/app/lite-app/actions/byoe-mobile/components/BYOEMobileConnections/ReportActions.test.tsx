import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiImportProvider, ApiReportRollbackState } from '@proton/activation/src/api/api.interface';

import { ReportActions } from './ReportActions';

const mockDispatch = jest.fn();
const mockTrackEvent = jest.fn();

jest.mock('@proton/activation/src/logic/reports/reports.actions', () => ({
    deleteReportSummary: (payload: unknown) => ({ type: 'delete', payload }),
    rollbackReportSummary: (payload: unknown) => ({ type: 'rollback', payload }),
}));
jest.mock('@proton/activation/src/logic/store', () => ({ useEasySwitchDispatch: () => mockDispatch }));
jest.mock('@proton/activation/src/hooks/useTrackImportAction', () => ({ useTrackImportAction: () => mockTrackEvent }));

const renderActions = (rollbackState?: ApiReportRollbackState) =>
    render(
        <ReportActions
            summary={{ localID: 'summary-id', product: 'mail', rollbackState } as any}
            report={{ account: 'jane@gmail.com', provider: ApiImportProvider.GOOGLE } as any}
        />
    );

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'Import actions' }));

describe('ReportActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDispatch.mockResolvedValue(undefined);
    });

    it('Should remove the report and track it after confirmation', async () => {
        renderActions();

        await openMenu();
        await userEvent.click(screen.getByRole('button', { name: 'Remove from the list' }));
        expect(mockDispatch).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'Remove', hidden: true }));

        expect(mockDispatch).toHaveBeenCalledWith({ type: 'delete', payload: { reportSummaryID: 'summary-id' } });
        expect(mockTrackEvent).toHaveBeenCalledWith('delete_report');
    });

    it('Should undo the import and track it after confirmation', async () => {
        renderActions(ApiReportRollbackState.CAN_ROLLBACK);

        await openMenu();
        await userEvent.click(screen.getByRole('button', { name: 'Undo import' }));
        await userEvent.click(screen.getByRole('button', { name: 'Yes, undo', hidden: true }));

        expect(mockDispatch).toHaveBeenCalledWith({ type: 'rollback', payload: { reportSummaryID: 'summary-id' } });
        expect(mockTrackEvent).toHaveBeenCalledWith('undo_import');
    });

    it('Should not offer to undo an import that cannot be rolled back', async () => {
        renderActions();

        await openMenu();

        expect(screen.queryByRole('button', { name: 'Undo import' })).toBeNull();
    });

    it('Should render nothing while the rollback is running', () => {
        const { container } = renderActions(ApiReportRollbackState.ROLLING_BACK);

        expect(container).toBeEmptyDOMElement();
    });
});
