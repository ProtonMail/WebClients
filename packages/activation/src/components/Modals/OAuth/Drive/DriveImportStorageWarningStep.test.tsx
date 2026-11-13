import { fireEvent, screen } from '@testing-library/dom';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { SubscriptionModalContext } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

import { easySwitchRender } from '../../../../tests/render';
import { DriveImportStorageWarningStep } from './DriveImportStorageWarningStep';

// useSettingsLink pulls in navigation/authentication context this test doesn't set up - stub it,
// the rest of the component (Redux dispatch, store) stays real.
jest.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockUseSettingsLink = useSettingsLink as jest.Mock;

describe('DriveImportStorageWarningStep', () => {
    it('lets the user ignore the warning without navigating away', () => {
        const goToSettings = jest.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportStorageWarningStep />);
        fireEvent.click(screen.getByText('Ignore'));

        expect(goToSettings).not.toHaveBeenCalled();
    });

    it('lets the user upgrade, navigating to the upgrade page', () => {
        const goToSettings = jest.fn();
        mockUseSettingsLink.mockReturnValue(goToSettings);

        easySwitchRender(<DriveImportStorageWarningStep />);
        fireEvent.click(screen.getByText('Upgrade'));

        expect(goToSettings).toHaveBeenCalledWith('/upgrade');
    });

    it('lets the user upgrade in the plan selection modal when the app provides it', () => {
        const goToSettings = jest.fn();
        const openSubscriptionModal = jest.fn();
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
