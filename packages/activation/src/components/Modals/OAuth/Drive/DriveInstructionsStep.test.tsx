import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import type * as OauthDraftActions from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { easySwitchRender } from '../../../../tests/render';
import { DriveInstructionsStep } from './DriveInstructionsStep';

// Keep the real action, only record the calls
vi.mock('../../../../logic/draft/oauthDraft/oauthDraft.actions', async (importOriginal) => {
    const actual = await importOriginal<typeof OauthDraftActions>();
    return { ...actual, resetOauthDraft: vi.fn(actual.resetOauthDraft) };
});

describe('DriveInstructionsStep', () => {
    it('cancels without starting OAuth', () => {
        const triggerOAuth = vi.fn();

        easySwitchRender(<DriveInstructionsStep triggerOAuth={triggerOAuth} />);
        fireEvent.click(screen.getByText('Maybe later'));

        expect(resetOauthDraft).toHaveBeenCalledTimes(1);
        expect(triggerOAuth).not.toHaveBeenCalled();
    });

    it('moves to the sign-in tutorial on Continue, which triggers OAuth on Google sign-in', () => {
        const triggerOAuth = vi.fn();

        easySwitchRender(<DriveInstructionsStep triggerOAuth={triggerOAuth} />);
        screen.getByText('1 of 4');
        fireEvent.click(screen.getByText('Continue'));

        screen.getByText('Sign in and grant access');
        screen.getByText('2 of 4');
        fireEvent.click(screen.getByText('Sign in with Google'));
        expect(triggerOAuth).toHaveBeenCalledTimes(1);
    });

    it('closes the import from the sign-in tutorial with the close button, its only way out', () => {
        const triggerOAuth = vi.fn();

        easySwitchRender(<DriveInstructionsStep triggerOAuth={triggerOAuth} />);
        fireEvent.click(screen.getByText('Continue'));
        screen.getByText('Sign in and grant access');
        fireEvent.click(screen.getByTestId('modal:close'));

        expect(resetOauthDraft).toHaveBeenCalledTimes(1);
        expect(triggerOAuth).not.toHaveBeenCalled();
    });
});
