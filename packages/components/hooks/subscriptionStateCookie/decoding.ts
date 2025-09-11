import { CYCLE, type Cycle, PLANS } from '@proton/payments';
import { decodeBase64URL } from '@proton/shared/lib/helpers/encoding';

import type {
    DecodedFreeCookieData,
    DecodedPaidCookieData,
    DecodedSubscriptionCookieData,
    EncodedFreeCookieData,
    EncodedPaidCookieData,
    EncodedSubscriptionCookieData,
} from './types';

/**
 * Validates if a value is a valid Cycle
 */
const isValidCycle = (value: any): value is Cycle => {
    const numericValue = +value;

    if (isNaN(numericValue)) {
        return false;
    }

    return Object.values(CYCLE).includes(numericValue);
};

/**
 * Validates if a value is a valid Plan Name
 */
const isValidPlanName = (value: any): value is PLANS => {
    return typeof value === 'string' && Object.values(PLANS).includes(value as PLANS);
};

/**
 * Validates if an object has all required properties for PaidCookieData
 */
const isValidPaidCookieStructure = (obj: any): obj is EncodedPaidCookieData => {
    return (
        obj &&
        typeof obj === 'object' &&
        't' in obj &&
        obj.t === 'p' &&
        'p' in obj &&
        isValidPlanName(obj.p) &&
        'c' in obj &&
        isValidCycle(obj.c)
    );
};

/**
 * Validates if an object has all required properties for FreeCookieData
 */
const isValidFreeCookieStructure = (obj: any): obj is EncodedFreeCookieData => {
    return (
        obj && typeof obj === 'object' && 't' in obj && obj.t === 'f' && 'h' in obj && (obj.h === '0' || obj.h === '1')
    );
};

/**
 * Parses a paid subscription object back to its original data
 * Returns null if the object is invalid
 */
const parsePaidSubscriptionData = (decoded: any): DecodedPaidCookieData | null => {
    try {
        if (!isValidPaidCookieStructure(decoded)) {
            return null;
        }

        return {
            type: 'paid',
            planName: decoded.p,
            cycle: decoded.c,
        };
    } catch {
        return null;
    }
};

/**
 * Parses a free subscription object back to its original data
 * Returns null if the object is invalid
 */
const parseFreeSubscriptionData = (decoded: any): DecodedFreeCookieData | null => {
    try {
        if (!isValidFreeCookieStructure(decoded)) {
            return null;
        }

        return {
            type: 'free',
            hasHadSubscription: decoded.h === '1',
        };
    } catch {
        return null;
    }
};

/**
 * Type guard to check if cookie data is paid subscription data
 */
const isPaidCookieData = (data: EncodedSubscriptionCookieData): data is EncodedPaidCookieData => {
    return data.t === 'p';
};

/**
 * Type guard to check if cookie data is free subscription data
 */
const isFreeCookieData = (data: EncodedSubscriptionCookieData): data is EncodedFreeCookieData => {
    return data.t === 'f';
};

/**
 * Subscription cookie decoder. Returns the decoded cookie data structure
 * Returns null if the cookie is invalid
 */
export const decodeSubscriptionCookieData = (encodedData: string): DecodedSubscriptionCookieData | null => {
    try {
        const decoded = JSON.parse(decodeBase64URL(encodedData));

        if (isPaidCookieData(decoded)) {
            return parsePaidSubscriptionData(decoded);
        }

        if (isFreeCookieData(decoded)) {
            return parseFreeSubscriptionData(decoded);
        }

        return null;
    } catch {
        return null;
    }
};
