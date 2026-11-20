import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments/core/billing-address/billing-address';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getDefaultMainCurrency } from '@proton/payments/core/currencies';
import type { Cycle } from '@proton/payments/core/interface';
import { getOptimisticPaymentStatus } from '@proton/payments/core/payment-status';
import { FREE_PLAN, getFreeCheckResult } from '@proton/payments/core/subscription/freePlans';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import type { SubscriptionData } from '../signup/interfaces';
import { type SignupModelV2, Steps, type Upsell, UpsellTypes } from './interface';

const getDefaultSubscriptionData = (cycle: Cycle): SubscriptionData => {
    return {
        skipUpsell: false,
        currency: getDefaultMainCurrency(),
        cycle,
        planIDs: {},
        checkResult: getFreeCheckResult(),
        billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
    };
};

const subscriptionDataCycleMapping = {
    [PLANS.FREE]: {
        [CYCLE.MONTHLY]: getDefaultSubscriptionData(CYCLE.MONTHLY),
        [CYCLE.YEARLY]: getDefaultSubscriptionData(CYCLE.YEARLY),
        [CYCLE.TWO_YEARS]: getDefaultSubscriptionData(CYCLE.TWO_YEARS),
        [CYCLE.FIFTEEN]: getDefaultSubscriptionData(CYCLE.FIFTEEN),
        [CYCLE.THIRTY]: getDefaultSubscriptionData(CYCLE.THIRTY),
    },
};

const defaultUpsell: Upsell = {
    mode: UpsellTypes.PLANS,
    currentPlan: undefined,
    unlockPlan: undefined,
    plan: undefined,
    addons: undefined,
    subscriptionOptions: {},
};
export const defaultSignupModel: SignupModelV2 = {
    session: undefined,
    domains: [],
    subscriptionData: subscriptionDataCycleMapping[PLANS.FREE][CYCLE.YEARLY],
    subscriptionDataCycleMapping,
    subscriptionDataCycleMappingByCurrency: [],
    paymentStatus: getOptimisticPaymentStatus(),
    humanVerificationMethods: [],
    humanVerificationToken: '',
    selectedProductPlans: {
        [Audience.B2C]: PLANS.MAIL,
        [Audience.B2B]: PLANS.MAIL_PRO,
        [Audience.FAMILY]: PLANS.FAMILY,
    },
    freePlan: FREE_PLAN,
    upsell: defaultUpsell,
    inviteData: undefined,
    plans: [],
    plansMap: {},
    referralData: undefined,
    step: Steps.Account,
    cache: undefined,
    optimistic: {},
    loadingDependencies: true,
    initialBillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
};
