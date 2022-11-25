import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import { SignupModel } from './interfaces';

export const DEFAULT_SIGNUP_MODEL: SignupModel = {
    domains: [],
    subscriptionData: {
        skipUpsell: false,
        currency: 'EUR',
        cycle: 12,
        planIDs: {},
        checkResult: getFreeCheckResult(),
    },
    paymentMethodStatus: {
        Card: false,
        Paypal: false,
        Apple: false,
        Cash: false,
        Bitcoin: false,
    },
    humanVerificationMethods: [],
    humanVerificationToken: '',
    selectedProductPlans: {
        [Audience.B2C]: PLANS.MAIL,
        [Audience.B2B]: PLANS.MAIL_PRO,
    },
    inviteData: undefined,
    plans: [],
    referralData: undefined,
};
