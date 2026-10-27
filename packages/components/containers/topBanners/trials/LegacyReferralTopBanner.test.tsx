import { fireEvent, screen } from '@testing-library/react';
import { addDays, getUnixTime } from 'date-fns';

import { useConfig } from '@proton/app-context/useConfig';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';

import { renderWithProviders } from '../../../testing/renderWithProviders';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import LegacyReferralTopBanner from './LegacyReferralTopBanner';

jest.mock('@proton/app-context/useConfig');

const mockOpenSubscriptionModal = jest.fn();
jest.mock('../../payments/subscription/SubscriptionModalProvider', () => ({
    useSubscriptionModal: () => [mockOpenSubscriptionModal, false],
}));

describe('LegacyReferralTopBanner', () => {
    const paidMail = buildSubscription(PLANS.MAIL, { ID: 'paid-mail' });
    const driveTrial = buildSubscription(PLANS.DRIVE, {
        ID: 'drive-trial',
        IsTrial: true,
        PeriodEnd: getUnixTime(addDays(new Date(), 3)),
    });

    const renderBanner = () =>
        renderWithProviders(<LegacyReferralTopBanner fromApp={APPS.PROTONDRIVE} subscription={driveTrial} />, {
            preloadedState: {
                subscription: getSubscriptionState({ ...paidMail, SecondarySubscriptions: [driveTrial] }),
            },
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('opens the checkout of the trial plan in the account app when the first subscription is paid without a trial', () => {
        (useConfig as jest.Mock).mockReturnValue({ APP_NAME: APPS.PROTONACCOUNT });

        renderBanner();

        fireEvent.click(screen.getByRole('button', { name: 'Continue using Drive Plus 200 GB' }));

        expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1);
        expect(mockOpenSubscriptionModal).toHaveBeenCalledWith({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            cycle: CYCLE.YEARLY,
            planIDs: { [PLANS.DRIVE]: 1 },
            upsellRef: 'upsell_drive-banner-trial-will-end_settings',
        });
    });

    it('links outside the account app to the upgrade path of the trial plan', () => {
        (useConfig as jest.Mock).mockReturnValue({ APP_NAME: APPS.PROTONDRIVE });

        renderBanner();

        expect(screen.getByRole('link', { name: 'Continue using Drive Plus 200 GB' })).toHaveAttribute(
            'href',
            '/drive/dashboard?ref=upsell_drive-banner-trial-will-end&target=compare&plan=drive2022'
        );
    });
});
