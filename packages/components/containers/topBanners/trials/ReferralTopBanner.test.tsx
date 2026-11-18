import { fireEvent, screen } from '@testing-library/react';
import { addDays, getUnixTime } from 'date-fns';
import type { Mock } from 'vitest';

import { usePlans } from '@proton/account/plans/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import useFeature from '@proton/features/useFeature';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';
import { TrialType } from '@proton/shared/lib/payments/subscription/constants';

import { renderWithProviders } from '../../../testing/vitest/renderWithProviders';
import ReferralTopBanner from './ReferralTopBanner';

vi.mock('@proton/app-context/useConfig');

vi.mock('@proton/features/useFeature');

vi.mock('@proton/account/plans/hooks', async () => ({
    ...(await vi.importActual('@proton/account/plans/hooks')),
    usePlans: vi.fn(),
}));

vi.mock('@proton/account/referralInfo/hooks', async () => ({
    ...(await vi.importActual('@proton/account/referralInfo/hooks')),
    useReferralInfo: vi.fn(),
}));

const mockOpenSubscriptionModal = vi.fn();
vi.mock('../../payments/subscription/subscriptionModalContext', () => ({
    useSubscriptionModal: () => [mockOpenSubscriptionModal, false],
}));

describe('ReferralTopBanner', () => {
    const paidMail = buildSubscription(PLANS.MAIL, { ID: 'paid-mail' });
    const passReferralTrial = buildSubscription(PLANS.PASS, {
        ID: 'pass-referral-trial',
        IsTrial: true,
        TrialType: TrialType.ReferralProgram,
        PeriodEnd: getUnixTime(addDays(new Date(), 3)),
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (useConfig as Mock).mockReturnValue({ APP_NAME: APPS.PROTONACCOUNT });
        (useFeature as Mock).mockReturnValue({ feature: { Value: true }, update: vi.fn() });
        (usePlans as Mock).mockReturnValue([{ plans: [], freePlan: FREE_PLAN }, false]);
        (useReferralInfo as Mock).mockReturnValue([
            { uiData: { refereeRewardAmount: '$20', referrerRewardAmount: '$20' } },
            false,
        ]);
    });

    it('uses the referral trial subscription it receives when the first subscription is paid without a trial', () => {
        renderWithProviders(<ReferralTopBanner app={APPS.PROTONPASS} subscription={passReferralTrial} />, {
            preloadedState: {
                subscription: getSubscriptionState({ ...paidMail, SecondarySubscriptions: [passReferralTrial] }),
            },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Continue using Pass Plus' }));
        fireEvent.click(screen.getByRole('button', { name: 'Get Pass Plus' }));

        expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1);
        expect(mockOpenSubscriptionModal).toHaveBeenCalledWith({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            planIDs: { [PLANS.PASS]: 1 },
            upsellRef: 'upsell_pass-banner-trial-will-end_settings',
            cycle: CYCLE.YEARLY,
        });
    });

    it('links outside the account app to the checkout of the referral trial plan', () => {
        (useConfig as Mock).mockReturnValue({ APP_NAME: APPS.PROTONPASS });

        renderWithProviders(<ReferralTopBanner app={APPS.PROTONPASS} subscription={passReferralTrial} />, {
            preloadedState: {
                subscription: getSubscriptionState({ ...paidMail, SecondarySubscriptions: [passReferralTrial] }),
            },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Continue using Pass Plus' }));

        expect(screen.getByRole('button', { name: 'Get Pass Plus' })).toHaveAttribute(
            'href',
            '/pass/dashboard?fixedPlan=true&cycle=12&target=checkout&plan=pass2023'
        );
        expect(screen.getByRole('button', { name: 'Explore other plans' })).toHaveAttribute(
            'href',
            '/pass/dashboard?cycle=12&target=compare&plan=pass2023'
        );
    });
});
