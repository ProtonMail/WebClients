import type { ADDON_NAMES, CURRENCIES, CYCLE, FREE_SUBSCRIPTION, PLANS } from './constants';

export type Currency = (typeof CURRENCIES)[number];

export interface AmountAndCurrency {
    Amount: number;
    Currency: Currency;
}

export interface PaymentVendorStates {
    Card: boolean;
    Paypal: boolean;
    Apple: boolean;
    Cash: boolean;
    Bitcoin: boolean;
    Google: boolean;
    Ideal: boolean;
}

/**
 * Important: Do not change this without contacting the payments team. Do not add new flows, do not remove existing
 * ones. The payment flow has an important role of displaying the payment methods and the tax country selector.
 */
export type PaymentMethodFlow =
    | 'invoice'
    | 'signup'
    | 'signup-pass'
    | 'signup-pass-upgrade'
    | 'signup-wallet'
    | 'signup-v2'
    | 'signup-v2-upgrade'
    | 'signup-vpn'
    | 'credit'
    | 'subscription'
    | 'add-card'
    | 'add-paypal'
    | 'reservation-donation';

type Quantity = number;

export type PlanIDs = Partial<{
    [planName in PLANS | ADDON_NAMES]: Quantity;
}>;

/**
 * The number of entitlements for the selected plan or addon. For example, `MaxMembers` key shows how many user seats
 * are included with a certain plan or addon.
 */
export type FeatureLimitKey =
    | 'MaxDomains'
    | 'MaxAddresses'
    | 'MaxSpace'
    | 'MaxMembers'
    | 'MaxVPN'
    | 'MaxTier'
    | 'MaxIPs' // synthetic key, it does't exist in the API
    | 'MaxAI' // synthetic key, it does't exist in the API
    | 'MaxLumo'
    | 'MaxMeet'; // synthetic key, it does't exist in the API

export type FreeSubscription = typeof FREE_SUBSCRIPTION;

export type Cycle =
    | CYCLE.MONTHLY
    | CYCLE.YEARLY
    | CYCLE.TWO_YEARS
    | CYCLE.THIRTY
    | CYCLE.FIFTEEN
    | CYCLE.THREE
    | CYCLE.EIGHTEEN
    | CYCLE.SIX;

export interface CycleMapping<T> {
    [CYCLE.MONTHLY]?: T;
    [CYCLE.YEARLY]?: T;
    [CYCLE.TWO_YEARS]?: T;
    // Not always included for all plans
    [CYCLE.THIRTY]?: T;
    [CYCLE.FIFTEEN]?: T;
    [CYCLE.THREE]?: T;
    [CYCLE.EIGHTEEN]?: T;
    [CYCLE.SIX]?: T;
}

export type Pricing = CycleMapping<number>;
