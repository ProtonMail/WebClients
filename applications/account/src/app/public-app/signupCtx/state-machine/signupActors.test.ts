import { createActor, toPromise } from 'xstate';

import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';

import type { AccountData } from '../../signup/interfaces';
import type { SignupContextSubscriptionData } from '../context/helpers/handleSetupUser';
import { type SignupServices, createSignupActors } from './signupActors';

const mockHandleSetupUser = vi.fn();
vi.mock('../context/helpers/handleSetupUser', () => ({
    handleSetupUser: (...args: unknown[]) => mockHandleSetupUser(...args),
}));

/** Sets up a referred user while the page selects the monthly cycle. */
const setupReferredUser = (subscriptionData: SignupContextSubscriptionData | undefined) => {
    const services = {
        payments: { selectedPlan: new SelectedPlan({ [PLANS.VPN2024]: 1 }, PLANS_MAP, CYCLE.MONTHLY, 'CHF') },
        getKtActivation: async () => undefined,
        paymentsDataConfig: { telemetryContext: 'ctx-signup-referral' },
    } as unknown as SignupServices;
    const input = {
        accountData: { password: 'password' } as AccountData,
        subscriptionData,
        referralData: { referralIdentifier: 'referrer' },
        isRetry: false,
    };
    return toPromise(createActor(createSignupActors(services).setupUser, { input }).start());
};

describe('setupUser', () => {
    beforeEach(() => mockHandleSetupUser.mockReset().mockResolvedValue({}));

    it('registers the referral with the plan paid for, or with the selection when the trial takes no payment', async () => {
        const subscriptionData = {
            planIDs: { [PLANS.BUNDLE]: 1 },
            cycle: CYCLE.YEARLY,
        } as SignupContextSubscriptionData;
        await setupReferredUser(subscriptionData);
        await setupReferredUser(undefined);

        expect(mockHandleSetupUser.mock.calls.map(([options]) => options.referralRegistrationPlan)).toEqual([
            { name: PLANS.BUNDLE, cycle: CYCLE.YEARLY },
            { name: PLANS.VPN2024, cycle: CYCLE.MONTHLY },
        ]);
    });
});
