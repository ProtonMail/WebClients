import type { Cycle, PLANS } from '@proton/payments';

export type EncodedPaidCookieData = {
    /**
     * Type: 'paid'
     */
    t: 'p';
    /**
     * Plan name
     */
    p: PLANS;
    /**
     * Cycle
     */
    c: Cycle;
};

export type EncodedFreeCookieData = {
    /**
     * Type: 'free'
     */
    t: 'f';
    /**
     * Subscription history
     * Used to determing if the user has churned
     */
    h: '1' | '0';
};

export type EncodedSubscriptionCookieData = EncodedPaidCookieData | EncodedFreeCookieData;

export type DecodedPaidCookieData = {
    /**
     * Type: 'paid'
     */
    type: 'paid';
    /**
     * Plan name
     */
    planName: PLANS;
    /**
     * Cycle
     */
    cycle: Cycle;
};

export type DecodedFreeCookieData = {
    /**
     * Type: 'free'
     */
    type: 'free';
    /**
     * Subscription history
     * Used to determing if the user has churned
     */
    hasHadSubscription: boolean;
};

export type DecodedSubscriptionCookieData = DecodedPaidCookieData | DecodedFreeCookieData;
