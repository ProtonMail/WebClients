import { fireEvent, screen } from '@testing-library/dom';
import { type Mock, vi } from 'vitest';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { SubscriptionModalContext } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

import { resetOauthDraft } from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import type * as OauthDraftActions from '../../../../logic/draft/oauthDraft/oauthDraft.actions';
import { easySwitchRender } from '../../../../tests/render';
import { DriveImportStorageWarningStep } from './DriveImportStorageWarningStep';

// useSettingsLink pulls in navigation/authentication context this test doesn't set up - stub it,
// the rest of the component (Redux dispatch, store) stays real.
vi.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: vi.fn(),
}));

const mockUseSettingsLink = useSettingsLink as Mock;

// Keep the real action, only record the calls
vi.mock('../../../../logic/draft/oauthDraft/oauthDraft.actions', async (importOriginal) => {
    const actual = await importOriginal<typeof OauthDraftActions>();
    return { ...actual, resetOauthDraft: vi.fn(actual.resetOauthDraft) };
});

describe('DriveImportStorageWarningStep', () => {
    it('lets the user ignore the warning without navigating away', () => {
        const goToSettings = vi.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportStorageWarningStep />);
        fireEvent.click(screen.getByText('Maybe later'));

        expect(resetOauthDraft).toHaveBeenCalledTimes(1);
        expect(goToSettings).not.toHaveBeenCalled();
    });

    it('lets the user upgrade, navigating to the upgrade page', () => {
        const goToSettings = vi.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportStorageWarningStep />);
        fireEvent.click(screen.getByText('Upgrade'));

        expect(goToSettings).toHaveBeenCalledWith('/upgrade');
    });

    it('lets the user upgrade in the plan selection modal when the app provides it', () => {
        const goToSettings = vi.fn();
        const openSubscriptionModal = vi.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(
            <SubscriptionModalContext.Provider value={[openSubscriptionModal, false, true]}>
                <DriveImportStorageWarningStep />
            </SubscriptionModalContext.Provider>
        );
        fireEvent.click(screen.getByText('Upgrade'));

        expect(openSubscriptionModal).toHaveBeenCalledWith({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
        expect(goToSettings).not.toHaveBeenCalled();
    });
});
