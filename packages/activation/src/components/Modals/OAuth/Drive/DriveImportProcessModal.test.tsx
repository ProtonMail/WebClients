import { screen } from '@testing-library/dom';
import { type MockedFunction, vi } from 'vitest';

import { IMPORT_ERROR } from '../../../../interface';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
    selectOauthImportStateStep,
} from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { easySwitchRender } from '../../../../tests/render';
import { createImporterTask } from '../StepLoading/useStepLoadingImporting.helpers';
import { DriveImportProcessModal } from './DriveImportProcessModal';

// Only stub the state read by this component and the helper that would hit the API - dispatch
// and the store itself stay real, so no other Redux wiring needs mocking.
vi.mock('../../../../logic/draft/oauthDraft/oauthDraft.selector', () => ({
    __esModule: true,
    selectOauthDraftProvider: vi.fn(),
    selectOauthImportStateStep: vi.fn(),
    selectOauthImportStateImporterData: vi.fn(),
}));

vi.mock('../StepLoading/useStepLoadingImporting.helpers', () => ({
    __esModule: true,
    createImporterTask: vi.fn(),
}));

const mockStep = selectOauthImportStateStep as any as MockedFunction<typeof selectOauthImportStateStep>;
const mockProvider = selectOauthDraftProvider as any as MockedFunction<typeof selectOauthDraftProvider>;
const mockImporterData = selectOauthImportStateImporterData as any as MockedFunction<
    typeof selectOauthImportStateImporterData
>;

const setState = (
    step: ReturnType<typeof selectOauthImportStateStep>,
    drive?: NonNullable<ReturnType<typeof selectOauthImportStateImporterData>>['drive']
) => {
    mockStep.mockReturnValue(step);
    mockProvider.mockReturnValue(undefined);
    mockImporterData.mockReturnValue(drive && { importerId: 'importer-id', importedEmail: 'user@gmail.com', drive });
};

describe('DriveImportProcessModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a disabled in-progress state while the import is being set up', () => {
        setState('prepare-import');

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText('Preparing your import');
        expect(screen.getByText('Got it')).toBeDisabled();
        expect(screen.getByTestId('modal:close')).toBeDisabled();
    });

    it('shows an enabled completed state once the step reaches success', () => {
        setState('success', {});

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText('Import started');
        expect(screen.getByText('Got it')).toBeEnabled();
        expect(screen.getByTestId('modal:close')).toBeEnabled();
    });

    it('starts the import anyway when storage will not be enough', () => {
        setState('prepare-import', { error: { code: IMPORT_ERROR.TOO_SHORT, message: 'x' } });

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText('Preparing your import');
        expect(createImporterTask).toHaveBeenCalled();
    });

    it('shows the storage warning step once the import has started', () => {
        setState('success', { error: { code: IMPORT_ERROR.TOO_SHORT, message: 'x' } });

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText(/storage won't be enough for this import/);
    });

    it('does not start the import on a blocking drive error', () => {
        setState('prepare-import', { error: { code: IMPORT_ERROR.NOT_EXISTS, message: 'x' } });

        easySwitchRender(<DriveImportProcessModal />);

        expect(createImporterTask).not.toHaveBeenCalled();
    });

    it('shows the empty-drive step when there is nothing to import', () => {
        setState('prepare-import', { error: { code: IMPORT_ERROR.NOT_EXISTS, message: 'x' } });

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText('We could not find anything to import');
    });

    it('shows the generic error step with the backend message for any other drive error', () => {
        setState('prepare-import', {
            error: { code: IMPORT_ERROR.UNEXPECTED_ERROR, message: 'Something specific broke' },
        });

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText('Something specific broke');
    });
});
