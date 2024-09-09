import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/components/payments/core';
import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { defaultVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';

import type { SignupModel } from './interfaces';

export const DEFAULT_SIGNUP_MODEL: SignupModel = {
    domains: [],
    freePlan: FREE_PLAN,
    subscriptionData: {
        skipUpsell: false,
        currency: 'EUR',
        cycle: 12,
        planIDs: {},
        checkResult: getFreeCheckResult(),
        billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
    },
    humanVerificationMethods: [],
    humanVerificationToken: '',
    selectedProductPlans: {
        [Audience.B2C]: PLANS.MAIL,
        [Audience.B2B]: PLANS.MAIL_PRO,
        [Audience.FAMILY]: PLANS.FAMILY,
    },
    inviteData: undefined,
    plans: [],
    plansMap: {},
    referralData: undefined,
    vpnServersCountData: defaultVPNServersCountData,
    paymentStatus: {
        CountryCode: DEFAULT_TAX_BILLING_ADDRESS.CountryCode,
        State: undefined,
        VendorStates: {
            Card: false,
            Paypal: false,
            Bitcoin: false,
            Apple: false,
            Cash: false,
        },
    },
};
