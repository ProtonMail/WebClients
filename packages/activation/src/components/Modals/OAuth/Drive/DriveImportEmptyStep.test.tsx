import { useEffect } from 'react';

import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '../../../../interface';
import { resetOauthDraft, startOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import type * as OauthDraftActions from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { selectOauthImportStateStep } from '../../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../../logic/store';
import { easySwitchRender } from '../../../../tests/render';
import { DriveImportEmptyStep } from './DriveImportEmptyStep';

// Keep the real action, only record the calls
vi.mock('../../../../logic/draft/oauthDraft/oauthDraft.actions', async (importOriginal) => {
    const actual = await importOriginal<typeof OauthDraftActions>();
    return { ...actual, resetOauthDraft: vi.fn(actual.resetOauthDraft) };
});

/**
 * Starts a Drive import draft in the Easy Switch store and shows its step. The draft stays without a step:
 * on 'prepare-import' the Easy Switch modal would render its own prepare view, which needs an importer.
 */
const DriveImportEmptyStepWithDraft = () => {
    const dispatch = useEasySwitchDispatch();
    const step = useEasySwitchSelector(selectOauthImportStateStep);

    useEffect(() => {
        dispatch(
            startOauthDraft({
                provider: ImportProvider.GOOGLE,
                products: [ImportType.DRIVE],
                source: EASY_SWITCH_SOURCES.UNKNOWN,
            })
        );
    }, []);

    return (
        <>
            <DriveImportEmptyStep />
            <output data-testid="oauth-step">{step}</output>
        </>
    );
};

describe('DriveImportEmptyStep', () => {
    it('goes back to the instructions on Try again', () => {
        easySwitchRender(<DriveImportEmptyStepWithDraft />);

        screen.getByText('Nothing to import');
        expect(screen.getByTestId('oauth-step')).toBeEmptyDOMElement();
        fireEvent.click(screen.getByText('Try again'));

        expect(screen.getByTestId('oauth-step')).toHaveTextContent('instructions');
        expect(resetOauthDraft).not.toHaveBeenCalled();
    });

    it('closes the import with the close button, its only way out', () => {
        easySwitchRender(<DriveImportEmptyStep />);

        fireEvent.click(screen.getByTestId('modal:close'));

        expect(resetOauthDraft).toHaveBeenCalledTimes(1);
    });
});
