import { CURRENCIES, CYCLE, type Currency, type Cycle, PLANS } from '@proton/payments';
import isEnumValue from '@proton/utils/isEnumValue';

/**
 * Gets plan from search params. Returns undefined if value is not a valid plan
 */
export const getPlan = (searchParams: URLSearchParams, key: string = 'plan') => {
    const plan = searchParams.get(key) || '';

    if (isEnumValue(plan, PLANS)) {
        return plan;
    }

    return undefined;
};

export const getCurrency = (searchParams: URLSearchParams, key: string = 'currency') => {
    const currency = searchParams.get(key) || '';

    if (CURRENCIES.includes(currency as Currency)) {
        return currency as Currency;
    }

    return undefined;
};

export const getCycle = (searchParams: URLSearchParams, keys: string | string[] = ['cycle', 'billing']) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];

    for (const key of keysArray) {
        const cycleParam = searchParams.get(key) || '';

        if (cycleParam) {
            const cycle = +cycleParam;

            if (!isNaN(cycle) && isEnumValue(cycle, CYCLE)) {
                return cycle as Cycle;
            }
        }
    }

    return undefined;
};

export const getCoupon = (searchParams: URLSearchParams, key: string = 'coupon') => {
    const coupon = searchParams.get(key)?.toUpperCase() || '';

    if (coupon) {
        return coupon;
    }

    return undefined;
};

export const getReferralIdentifier = (searchParams: URLSearchParams, key: string = 'referrer') => {
    const referrer = searchParams.get(key) || '';

    if (referrer) {
        return referrer;
    }

    return undefined;
};

export const getReferralID = (searchParams: URLSearchParams, key: string = 'invite') => {
    const invite = searchParams.get(key) || '';

    if (invite) {
        return invite;
    }

    return undefined;
};

export const getReferrerName = (searchParams: URLSearchParams, key: string = 'referrerName') => {
    const referrerName = searchParams.get(key) || '';

    if (referrerName) {
        return referrerName;
    }

    return undefined;
};
