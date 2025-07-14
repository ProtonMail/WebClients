import type { Location } from 'history';

import { getAutoCoupon } from '@proton/components/containers/payments/subscription/helpers';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import type { BillingAddress, PaymentMethodStatusExtended, PaymentsApi } from '@proton/payments';
import {
    type CheckSubscriptionData,
    type Currency,
    type Cycle,
    DEFAULT_TAX_BILLING_ADDRESS,
    PLANS,
    type PlanIDs,
    getFreeCheckResult,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { type SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

export async function getSubscriptionPrices(
    paymentsApi: PaymentsApi,
    planIDs: PlanIDs,
    currency: Currency,
    cycle: Cycle,
    billingAddress?: BillingAddress,
    maybeCoupon?: string,
    trial?: boolean
): Promise<SubscriptionCheckResponse> {
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
            ZipCode: billingAddress.ZipCode,
        };
    }

    if (trial) {
        data.IsTrial = true;
    }

    return paymentsApi.checkWithAutomaticVersion(data);
}

export async function getSubscriptionPricesWithFallback<T>(
    paymentsApi: PaymentsApi,
    planIDs: PlanIDs,
    currency: Currency,
    cycle: Cycle,
    billingAddress: BillingAddress | undefined,
    maybeCoupon: string | undefined,
    {
        invalidZipCodeFallback,
    }: {
        invalidZipCodeFallback: () => T;
    }
): Promise<SubscriptionCheckResponse | T> {
    try {
        return await getSubscriptionPrices(paymentsApi, planIDs, currency, cycle, billingAddress, maybeCoupon);
    } catch (error) {
        if (error instanceof InvalidZipCodeError) {
            return invalidZipCodeFallback();
        }
        throw error;
    }
}

export const isMailReferAFriendSignup = (location: Location) => {
    return location.pathname.includes(SSO_PATHS.REFER);
};

export const isPorkbunSignup = (location: Location) => {
    return (
        location.pathname.includes(SSO_PATHS.PORKBUN_SIGNUP) || location.pathname.includes(SSO_PATHS.PORKBUN_SIGN_IN)
    );
};

export const getSignupApplication = (APP_NAME: APP_NAMES) => {
    if (APP_NAME === 'proton-vpn-settings') {
        return 'proton-vpn-settings';
    }

    return 'proton-account';
};

export const getOptimisticDomains = () => {
    let secondLevelDomain = getSecondLevelDomain(window.location.hostname);
    if (secondLevelDomain.endsWith('.onion') || secondLevelDomain.includes('protonvpn')) {
        secondLevelDomain = 'proton.me';
    }
    return [secondLevelDomain, 'protonmail.com'];
};

export const getOptimisticPaymentMethods = (): PaymentMethodStatusExtended => {
    const defaultValue = {
        VendorStates: {
            Card: false,
            Paypal: false,
            Apple: false,
            Cash: false,
            Bitcoin: false,
        },
        CountryCode: DEFAULT_TAX_BILLING_ADDRESS.CountryCode,
        State: DEFAULT_TAX_BILLING_ADDRESS.State,
        ZipCode: DEFAULT_TAX_BILLING_ADDRESS.ZipCode,
    };

    return {
        ...defaultValue,
        VendorStates: {
            ...defaultValue.VendorStates,
            // We guess that card and PayPal are active by default
            Card: true,
            Paypal: true,
        },
    };
};
