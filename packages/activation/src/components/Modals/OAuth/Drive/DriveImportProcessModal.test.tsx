import { screen } from '@testing-library/dom';

import { IMPORT_ERROR } from '../../../../interface';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
    selectOauthImportStateStep,
} from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { easySwitchRender } from '../../../../tests/render';
import { DriveImportProcessModal } from './DriveImportProcessModal';

// Only stub the state read by this component and the helper that would hit the API - dispatch
// and the store itself stay real, so no other Redux wiring needs mocking.
jest.mock('../../../../logic/draft/oauthDraft/oauthDraft.selector', () => ({
    __esModule: true,
    selectOauthDraftProvider: jest.fn(),
    selectOauthImportStateStep: jest.fn(),
    selectOauthImportStateImporterData: jest.fn(),
}));

jest.mock('../StepLoading/useStepLoadingImporting.helpers', () => ({
    __esModule: true,
    createImporterTask: jest.fn(),
}));

const mockStep = selectOauthImportStateStep as any as jest.Mock<ReturnType<typeof selectOauthImportStateStep>>;
const mockProvider = selectOauthDraftProvider as any as jest.Mock<ReturnType<typeof selectOauthDraftProvider>>;
const mockImporterData = selectOauthImportStateImporterData as any as jest.Mock<
    ReturnType<typeof selectOauthImportStateImporterData>
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
    it('shows a disabled in-progress state while the import is being set up', () => {
        setState('prepare-import');

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText('Setting up your import');
        expect(screen.getByText('Got it')).toBeDisabled();
        expect(screen.getByTestId('modal:close')).toBeDisabled();
    });

    it('shows an enabled completed state once the step reaches success', () => {
        setState('success', {});

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText('Your import is starting');
        expect(screen.getByText('Got it')).toBeEnabled();
        expect(screen.getByTestId('modal:close')).toBeEnabled();
    });

    it('shows the storage warning step for a too-short-storage error', () => {
        setState('prepare-import', { error: { code: IMPORT_ERROR.TOO_SHORT, message: 'x' } });

        easySwitchRender(<DriveImportProcessModal />);

        screen.getByText(/storage won't be enough for this import/);
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
