import type { Location } from 'history';

import {
    type BillingAddress,
    type CheckSubscriptionData,
    type Currency,
    type Cycle,
    PLANS,
    type PaymentsApi,
    type PlanIDs,
    type SubscriptionEstimation,
    getFreeCheckResult,
    hasPlanIDs,
} from '@proton/payments';
import { getAutoCoupon } from '@proton/payments/core/subscription/helpers';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { getCroHeaders, getOwnershipVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import type { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

import { getTokenPayment } from '../signupCtx/context/helpers/handleCreateUser';
import { SignupHumanVerification } from './interfaces';

export async function getSubscriptionPrices({
    paymentsApi,
    planIDs,
    currency,
    cycle,
    billingAddress,
    coupon: maybeCoupon,
    trial,
    ValidateBillingAddress,
    VatId,
}: {
    paymentsApi: PaymentsApi;
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    billingAddress?: BillingAddress;
    coupon?: string;
    trial?: boolean;
    ValidateBillingAddress?: boolean;
    VatId: string | undefined;
}): Promise<SubscriptionEstimation> {
    if (!hasPlanIDs(planIDs) || planIDs[PLANS.FREE]) {
        return getFreeCheckResult(currency, cycle);
    }

    const coupon = getAutoCoupon({ coupon: maybeCoupon, planIDs, cycle, trial, currency });

    const data: CheckSubscriptionData = {
        Plans: planIDs,
        Currency: currency,
        Cycle: cycle,
        CouponCode: coupon,
        ValidateBillingAddress,
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

export const getPaymentTokenForExternalUsers = (
    hvMode: SignupHumanVerification | undefined,
    paymentToken: string | undefined
) => {
    if (hvMode === SignupHumanVerification.DEFERRED && paymentToken) {
        return {
            Token: paymentToken,
            TokenType: 'payment' as HumanVerificationMethodType,
        };
    }
    if (hvMode === SignupHumanVerification.IMMEDIATE) {
        return undefined;
    }
    return getTokenPayment(paymentToken);
};

export const getHVHeadersBasedOnSignupMode = (
    hvMode: SignupHumanVerification | undefined,
    paymentToken: string | undefined
) => {
    if (hvMode === SignupHumanVerification.DEFERRED) {
        return paymentToken ? getCroHeaders(paymentToken) : getOwnershipVerificationHeaders('lax');
    }
    return {};
};
