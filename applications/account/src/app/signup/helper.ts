import { Location } from 'history';

import { getAutoCoupon } from '@proton/components/containers/payments/subscription/helpers';
import { BillingAddress, PaymentsApi } from '@proton/components/payments/core';
import { CheckSubscriptionData } from '@proton/shared/lib/api/payments';
import { APP_NAMES, PLANS, SSO_PATHS } from '@proton/shared/lib/constants';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { Currency, Cycle } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import { PlanIDs } from './interfaces';

export async function getSubscriptionPrices(
    paymentsApi: PaymentsApi,
    planIDs: PlanIDs,
    currency: Currency,
    cycle: Cycle,
    billingAddress?: BillingAddress,
    maybeCoupon?: string
) {
    if (!hasPlanIDs(planIDs) || planIDs[PLANS.FREE]) {
        return getFreeCheckResult(currency, cycle);
    }

    const coupon = getAutoCoupon({ coupon: maybeCoupon, planIDs, cycle });

    const data: CheckSubscriptionData = {
        Plans: planIDs,
        Currency: currency,
        Cycle: cycle,
        CouponCode: coupon,
    };

    if (billingAddress) {
        data.BillingAddress = {
            State: billingAddress.State,
            CountryCode: billingAddress.CountryCode,
        };
    }

    return paymentsApi.checkWithAutomaticVersion(data);
}

export const isMailTrialSignup = (location: Location) => {
    return location.pathname.includes(SSO_PATHS.TRIAL);
};

export const isMailReferAFriendSignup = (location: Location) => {
    return location.pathname.includes(SSO_PATHS.REFER);
};

export const getSignupApplication = (APP_NAME: APP_NAMES) => {
    if (APP_NAME === 'proton-vpn-settings') {
        return 'proton-vpn-settings';
    }

    return 'proton-account';
};
