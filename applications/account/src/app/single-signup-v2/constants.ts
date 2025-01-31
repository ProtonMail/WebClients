import { CYCLE, DEFAULT_CURRENCY, DEFAULT_TAX_BILLING_ADDRESS, PLANS } from '@proton/payments';
import { Audience, type Cycle } from '@proton/shared/lib/interfaces';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { defaultVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';

import { getOptimisticPaymentMethods } from '../signup/helper';
import type { SubscriptionData } from '../signup/interfaces';
import { type SignupModelV2, Steps, type Upsell, UpsellTypes } from './interface';

const getDefaultSubscriptionData = (cycle: Cycle): SubscriptionData => {
    return {
        skipUpsell: false,
        currency: DEFAULT_CURRENCY,
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

export const defaultUpsell: Upsell = {
    mode: UpsellTypes.PLANS,
    currentPlan: undefined,
    unlockPlan: undefined,
    plan: undefined,
    subscriptionOptions: {},
};
export const defaultSignupModel: SignupModelV2 = {
    session: undefined,
    domains: [],
    subscriptionData: subscriptionDataCycleMapping[PLANS.FREE][CYCLE.YEARLY],
    subscriptionDataCycleMapping,
    subscriptionDataCycleMappingByCurrency: [],
    paymentMethodStatusExtended: getOptimisticPaymentMethods(),
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
    vpnServersCountData: defaultVPNServersCountData,
    loadingDependencies: true,
};
