import type { Currency, Cycle } from '@proton/shared/lib/payments/interface';
import type { SubscriptionMode, TaxMode } from '@proton/shared/lib/payments/subscription/constants';
import type { Coupon, CouponDiscountBreakdownBE, Tax } from '@proton/shared/lib/payments/subscription/interface';

import type { CheckSubscriptionData } from '../api/api';
import type { InvalidCouponError, WrongBillingAddressError } from '../errors';

export type {
    Coupon,
    CouponDiscountBreakdownBE,
    FullPlansMap,
    MaybeFreeSubscription,
    Subscription,
    SubscriptionCheckForbiddenReason,
    Tax,
} from '@proton/shared/lib/payments/subscription/interface';

interface SubscriptionCheckResponse {
    /**
     * Full amount for the selected subscription. It doesn't include any discounts. The amount is in cents.
     */
    Amount: number;
    /**
     * Amount that will be charged for the selected subscription. It includes all discounts and taxes. This is the
     * amount that the user will pay. The amount is in cents.
     */
    AmountDue: number;
    /**
     * If user has an active subscription and selects another plan, then in some cases the new subscription can be
     * prorated. Proration means that the amount due will be lowered corresponding to the unused days from the previous
     * subscription. The amount is in cents.
     */
    Proration?: number;
    /**
     * Coupon discount. The amount is in cents.
     */
    CouponDiscount?: number;
    Coupon: Coupon;
    /**
     * In case of custom billings, the property will show the discount when user adds an addon mid-cycle. This property
     * is kind of "proration for custom billings". The amount is in cents.
     */
    UnusedCredit?: number;
    /**
     * How many credits will be subtracted or added to the user account. Subtraction can happen if user has credits.
     * Credits can be added e.g. if user already has a subscription and the new one is cheaper. Then the new
     * subscription will be paid with the prorated amount and the rest will be added as credits. The amount is in cents.
     */
    Credit?: number;
    Currency: Currency;
    Cycle: Cycle;
    /**
     * Discount from a gift code. The amount is in cents.
     */
    Gift?: number;
    /**
     * When the subscription will end. Unix seconds.
     */
    PeriodEnd: number;
    Taxes?: Tax[];
    TaxMode?: TaxMode;
    /**
     * Subscription mode dictates when subscription starts and what exactly user pays for.
     */
    SubscriptionMode: SubscriptionMode;
    /**
     * Sometimes amount for the second subscription term (renew amount) is different from the first one. In this case
     * this property will have the renew amount.
     */
    BaseRenewAmount: number | null;
    /**
     * Sometimes cycle for the second subscription term (renew cycle) is different from the first one. In this case
     * this property will have the renew cycle.
     */
    RenewCycle: Cycle | null;

    CouponDiscountBreakdown?: CouponDiscountBreakdownBE | null;
}

export type SubscriptionEstimation = SubscriptionCheckResponse & {
    /**
     * Just echoes the same properties from the request payload.
     */
    requestData: CheckSubscriptionData;
    /**
     * The property doesn't exist on the backend. If the check response is created by the frontend then it should be
     * considered optimistic.
     */
    optimistic?: boolean;

    error?: WrongBillingAddressError | InvalidCouponError;
};
