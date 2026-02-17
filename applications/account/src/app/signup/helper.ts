import type { Location } from 'history';

import {
    type BillingAddress,
    type CheckSubscriptionData,
    type Currency,
    type Cycle,
    type EnrichedCheckResponse,
    PLANS,
    type PaymentsApi,
    type PlanIDs,
    getFreeCheckResult,
    hasPlanIDs,
} from '@proton/payments';
import { getAutoCoupon } from '@proton/payments/core/subscription/helpers';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

export async function getSubscriptionPrices({
    paymentsApi,
    planIDs,
    currency,
    cycle,
    billingAddress,
    coupon: maybeCoupon,
    trial,
    ValidateZipCode,
    VatId,
}: {
    paymentsApi: PaymentsApi;
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    billingAddress?: BillingAddress;
    coupon?: string;
    trial?: boolean;
    ValidateZipCode?: boolean;
    VatId: string | undefined;
}): Promise<EnrichedCheckResponse> {
    if (!hasPlanIDs(planIDs) || planIDs[PLANS.FREE]) {
        return getFreeCheckResult(currency, cycle);
    }

    const coupon = getAutoCoupon({ coupon: maybeCoupon, planIDs, cycle, trial, currency });

    const data: CheckSubscriptionData = {
        Plans: planIDs,
        Currency: currency,
        Cycle: cycle,
        CouponCode: coupon,
        ValidateZipCode,
        VatId,
    };

    if (billingAddress) {
        data.BillingAddress = {
            State: billingAddress.State,
            CountryCode: billingAddress.CountryCode,
            ZipCode: billingAddress.ZipCode,
        };
    }

    if (trial) {
        data.IsTrial = true;
    }

    return paymentsApi.checkSubscription(data);
}

export const isReferralSignup = (location: Location) => {
    return (
        location.pathname.includes(SSO_PATHS.REFERAL_PLAN_SELECTION) ||
        location.pathname.includes(SSO_PATHS.REFERAL_SIGNUP)
    );
};

export const isPorkbunSignup = (location: Location) => {
    return (
        location.pathname.includes(SSO_PATHS.PORKBUN_SIGNUP) || location.pathname.includes(SSO_PATHS.PORKBUN_SIGN_IN)
    );
};

export const getOptimisticDomains = () => {
    let secondLevelDomain = getSecondLevelDomain(window.location.hostname);
    if (secondLevelDomain.endsWith('.onion') || secondLevelDomain.includes('protonvpn')) {
        secondLevelDomain = 'proton.me';
    }
    return [secondLevelDomain, 'protonmail.com'];
};
