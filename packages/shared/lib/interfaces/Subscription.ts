import type { Currency, Cycle, ProrationMode } from '@proton/payments';

import type { Nullable } from './utils';

export interface Tax {
    Name: string;
    /**
     * Tax rate in percent. For example, value can be 8.5 for 8.5%.
     */
    Rate: number;
    /**
     * Tax amount in cents. It must be an integer.
     */
    Amount: number;
}

export enum TaxInclusive {
    EXCLUSIVE = 0,
    INCLUSIVE = 1,
}

export enum SubscriptionMode {
    Regular = 0,
    CustomBillings = 1,
    ScheduledChargedImmediately = 2,
    ScheduledChargedLater = 3,
    Trial = 4,
}

export type Coupon = Nullable<{
    Code: string;
    Description: string;
    MaximumRedemptionsPerUser: number | null;
}>;

export interface SubscriptionCheckResponse {
    Amount: number;
    AmountDue: number;
    Proration?: number;
    CouponDiscount?: number;
    Coupon: Coupon;
    UnusedCredit?: number;
    Credit?: number;
    Currency: Currency;
    Cycle: Cycle;
    Gift?: number;
    PeriodEnd: number;
    Taxes?: Tax[];
    TaxInclusive?: TaxInclusive;
    SubscriptionMode: SubscriptionMode;
    optimistic?: boolean;
    /**
     * This property doesn't actually exist in the response.
     * It's added by the frontend and echoes the same property from the request.
     */
    ProrationMode?: ProrationMode;
    BaseRenewAmount: number | null;
    RenewCycle: Cycle | null;
}

export enum Audience {
    B2C = 'b2c',
    B2B = 'b2b',
    FAMILY = 'family',
}
