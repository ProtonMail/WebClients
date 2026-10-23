import { screen } from '@testing-library/react';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { TrialType } from '@proton/payments/core/subscription/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';

import { renderWithProviders } from '../../../../testing/renderWithProviders';
import ReferralTrialInfoDashboardV2 from './ReferralTrialInfoDashboardV2';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    ...jest.requireActual('@proton/account/entitlementCatalog/hooks'),
    useEntitlementCatalog: jest.fn(),
}));

jest.mock('@proton/account/referralInfo/hooks', () => ({
    ...jest.requireActual('@proton/account/referralInfo/hooks'),
    useReferralInfo: jest.fn(),
}));

describe('ReferralTrialInfoDashboardV2', () => {
    const trialEnd = Math.floor(new Date(2027, 2, 15, 12).getTime() / 1000);
    const paidMailEnd = Math.floor(new Date(2027, 8, 1, 12).getTime() / 1000);

    const paidMail = buildSubscription(PLANS.MAIL, { ID: 'paid-mail', PeriodEnd: paidMailEnd });
    const passReferralTrial = buildSubscription(PLANS.PASS, {
        ID: 'pass-referral-trial',
        IsTrial: true,
        TrialType: TrialType.ReferralProgram,
        PeriodEnd: trialEnd,
    });

    const renderInfo = (subscription: Subscription) =>
        renderWithProviders(<ReferralTrialInfoDashboardV2 />, {
            preloadedState: { subscription: getSubscriptionState(subscription) },
        });

    beforeEach(() => {
        jest.clearAllMocks();
        (useEntitlementCatalog as jest.Mock).mockReturnValue([buildEntitlementCatalog({}), false]);
        (useReferralInfo as jest.Mock).mockReturnValue([{ uiData: { referrerRewardAmount: '$20' } }, false]);
    });

    it('shows the plan title and end date of a single referral trial', () => {
        renderInfo(passReferralTrial);

        expect(screen.getByText(/How your free trial works:/).parentElement).toHaveTextContent(
            'How your free trial works: Enjoy Pass Plus for free until March 15th, 2027. If you subscribe before this date, you’ll get $20 in credits. If you don’t subscribe, you’ll be downgraded to Proton Free.'
        );
    });

    it('shows the referral trial title and date when the first subscription is paid without a trial', () => {
        renderInfo({ ...paidMail, SecondarySubscriptions: [passReferralTrial] });

        expect(screen.getByText(/How your free trial works:/).parentElement).toHaveTextContent(
            'How your free trial works: Enjoy Pass Plus for free until March 15th, 2027. If you subscribe before this date, you’ll get $20 in credits. If you don’t subscribe, you’ll be downgraded to Proton Free.'
        );
    });

    it.each([
        { name: 'a free user', subscription: FREE_SUBSCRIPTION as unknown as Subscription },
        { name: 'a paid subscription without a trial', subscription: paidMail },
        {
            name: 'a trial that is not a referral trial',
            subscription: { ...passReferralTrial, TrialType: TrialType.FamilyPlan },
        },
    ] as const)('renders nothing for $name', ({ subscription }) => {
        const { container } = renderInfo(subscription);

        expect(container).toBeEmptyDOMElement();
    });
});
