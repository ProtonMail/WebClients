import { screen } from '@testing-library/react';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { TrialType } from '@proton/shared/lib/payments/subscription/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';

import { renderWithProviders } from '../../../../testing/renderWithProviders';
import ReferralTrialInfo from './ReferralTrialInfo';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    ...jest.requireActual('@proton/account/entitlementCatalog/hooks'),
    useEntitlementCatalog: jest.fn(),
}));

jest.mock('@proton/account/referralInfo/hooks', () => ({
    ...jest.requireActual('@proton/account/referralInfo/hooks'),
    useReferralInfo: jest.fn(),
}));

jest.mock('../../../payments/subscription/SubscriptionModalProvider', () => ({
    useSubscriptionModal: () => [jest.fn(), false],
}));

describe('ReferralTrialInfo', () => {
    const trialEnd = Math.floor(new Date(2027, 2, 15, 12).getTime() / 1000);

    const paidMail = buildSubscription(PLANS.MAIL, { ID: 'paid-mail' });
    const bundleReferralTrial = buildSubscription(PLANS.BUNDLE, {
        ID: 'bundle-referral-trial',
        IsTrial: true,
        TrialType: TrialType.ReferralProgram,
        PeriodEnd: trialEnd,
    });

    const renderTrialInfo = (subscription: Subscription) =>
        renderWithProviders(<ReferralTrialInfo />, {
            preloadedState: { subscription: getSubscriptionState(subscription) },
        });

    beforeEach(() => {
        jest.clearAllMocks();
        (useEntitlementCatalog as jest.Mock).mockReturnValue([buildEntitlementCatalog({}), false]);
        (useReferralInfo as jest.Mock).mockReturnValue([{ uiData: { referrerRewardAmount: '$20' } }, false]);
    });

    it('describes the referral trial when the first subscription is paid without a trial', () => {
        renderTrialInfo({ ...paidMail, SecondarySubscriptions: [bundleReferralTrial] });

        expect(screen.getByText(/Enjoy/).parentElement).toHaveTextContent(
            'Enjoy Proton Unlimited for free until March 15th, 2027.'
        );
        expect(screen.getByTestId('trial-info-cancel-subscription')).toHaveTextContent('Cancel subscription');
        expect(screen.queryByTestId('trial-info-subscribe-now')).not.toBeInTheDocument();
    });

    it('renders nothing for a free user', () => {
        const { container } = renderTrialInfo(FREE_SUBSCRIPTION as unknown as Subscription);

        expect(container).toBeEmptyDOMElement();
    });
});
