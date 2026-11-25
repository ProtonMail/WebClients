import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '../../../../interface';
import { changeOAuthStep, startOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { selectOauthImportStateStep } from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../logic/store';
import { easySwitchRender } from '../../../../tests/render';
import { DriveImportFlow } from './DriveImportFlow';

// The only helper that would hit the API
vi.mock('../StepLoading/useStepLoadingImporting.helpers', () => ({
    __esModule: true,
    createImporterTask: vi.fn(),
}));

// The test store renders the default OAuth modal for a started draft; only the flow under test should show
vi.mock('../../MainModal', () => ({ __esModule: true, default: () => null }));

/** Renders the flow the way OAuthModal does: same slot for every step, triggerOAuth on the instructions step only */
const Harness = () => {
    const dispatch = useEasySwitchDispatch();
    const step = useEasySwitchSelector(selectOauthImportStateStep);

    const start = () => {
        dispatch(
            startOauthDraft({
                provider: ImportProvider.GOOGLE,
                products: [ImportType.DRIVE],
                source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
            })
        );
        dispatch(changeOAuthStep('instructions'));
    };

    return (
        <>
            {step && <DriveImportFlow triggerOAuth={step === 'instructions' ? () => {} : undefined} />}
            <button onClick={start}>start</button>
            <button onClick={() => dispatch(changeOAuthStep('prepare-import'))}>to prepare</button>
            <button onClick={() => dispatch(changeOAuthStep('success'))}>to success</button>
        </>
    );
};

describe('DriveImportFlow', () => {
    it('keeps the same dialog open from the intro to "Import started"', () => {
        easySwitchRender(<Harness />);
        fireEvent.click(screen.getByText('start'));

        screen.getByText('Easy Switch from Google Drive');
        const dialog = document.querySelector('dialog');
        const expectSameDialog = () => {
            expect(document.querySelectorAll('dialog')).toHaveLength(1);
            expect(document.querySelector('dialog')).toBe(dialog);
        };

        fireEvent.click(screen.getByText('Continue'));
        screen.getByText('Sign in and grant access');
        expectSameDialog();

        fireEvent.click(screen.getByText('to prepare'));
        screen.getByText('Preparing your import');
        expect(screen.getByTestId('modal:close')).toBeDisabled();
        expectSameDialog();

        fireEvent.click(screen.getByText('to success'));
        screen.getByText('Import started');
        expect(screen.getByTestId('modal:close')).toBeEnabled();
        expectSameDialog();
    });
});
