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

export const getCycle = (searchParams: URLSearchParams, key: string = 'cycle') => {
    const cycleParam = searchParams.get(key) || '';

    const cycle = +cycleParam;

    if (isNaN(cycle)) {
        return undefined;
    }

    if (isEnumValue(cycle, CYCLE)) {
        return cycle as Cycle;
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
