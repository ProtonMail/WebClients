import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiImportProvider, ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';

import { ImporterActions } from './ImporterActions';

const mockDispatch = jest.fn();
const mockTrackEvent = jest.fn();
const mockApi = jest.fn();
const mockCall = jest.fn();

jest.mock('@proton/activation/src/logic/importers/importers.actions', () => ({
    cancelImporter: (payload: unknown) => ({ type: 'cancel', payload }),
}));
jest.mock('@proton/activation/src/logic/store', () => ({ useEasySwitchDispatch: () => mockDispatch }));
jest.mock('@proton/activation/src/hooks/useTrackImportAction', () => ({ useTrackImportAction: () => mockTrackEvent }));
jest.mock('@proton/app-context/useApi', () => ({ useApi: () => mockApi }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('@proton/components/hooks/useEventManager', () => ({
    __esModule: true,
    default: () => ({ call: mockCall }),
}));

const renderActions = (activeImporter: Record<string, unknown> = {}) =>
    render(
        <ImporterActions
            activeImporter={
                {
                    localID: 'local-id',
                    product: 'mail',
                    importState: ApiImporterState.RUNNING,
                    ...activeImporter,
                } as any
            }
            importer={{ ID: 'importer-id', account: 'jane@gmail.com', provider: ApiImportProvider.GOOGLE } as any}
        />
    );

describe('ImporterActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDispatch.mockResolvedValue(undefined);
        mockApi.mockResolvedValue({});
    });

    it('Should only cancel and track once the user confirmed', async () => {
        renderActions();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mockDispatch).not.toHaveBeenCalled();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel import', hidden: true }));

        expect(mockDispatch).toHaveBeenCalledWith({ type: 'cancel', payload: { activeImporterID: 'local-id' } });
        expect(mockTrackEvent).toHaveBeenCalledWith('cancel_import');
    });

    it('Should resume a paused importer and track it', async () => {
        renderActions({ importState: ApiImporterState.PAUSED });

        await userEvent.click(screen.getByRole('button', { name: 'Resume' }));

        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(mockTrackEvent).toHaveBeenCalledWith('resume_import');
    });

    it('Should not offer to resume when the connection needs to be re-authenticated', () => {
        renderActions({
            importState: ApiImporterState.PAUSED,
            errorCode: ApiImporterError.ERROR_CODE_IMAP_CONNECTION,
        });

        expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull();
    });

    it('Should not offer to resume a running importer', () => {
        renderActions();

        expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull();
    });
});
