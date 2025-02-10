import { type ReactNode } from 'react';

import { type CYCLE, type PlanIDs } from '@proton/payments';
import { type PlansMap, type StrictRequired, type SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

export type CouponConfigProps = {
    checkResult: SubscriptionCheckResponse | undefined;
    planIDs: PlanIDs;
    plansMap: PlansMap;
};

export type CouponConfigRequiredProps = StrictRequired<CouponConfigProps>;

export function isCouponConfigRequiredProps(props: CouponConfigProps): props is CouponConfigRequiredProps {
    return props.checkResult !== undefined;
}

export type CouponConfig = {
    /**
     * The coupon code that triggers this config.
     */
    coupon: string;
    /**
     * If set to true then the coupon will not be displayed in the UI. It hides the coupon and "coupon discount" number.
     * In addition, it changes the displayed price per user and total. These amounts now include the discount.
     */
    hidden: boolean;
    /**
     * If this react function is defined then it will render a text right below the "amount due" text. Can be helpful
     * to display some custom promotion messages. If not specified then this component isn't present at all.
     */
    amountDueMessage?: (props: CouponConfigRequiredProps) => ReactNode;
    /**
     * You can override the subscription modal subtitle with this function.
     */
    checkoutSubtitle?: () => ReactNode;
    /**
     * This function adds a price comparison component inside the cycle selector. It's not present by default.
     * It can be used to highlight that the old price was *this high*. You can return any react node from it really,
     * but the primary idea was returning the <Price> component from it.
     */
    cyclePriceCompare?: (params: { cycle: CYCLE; suffix?: string }, config: CouponConfigRequiredProps) => ReactNode;
    /**
     * You can override the cycle title with this function. It can change the usual "1 month" or "12 months" title to
     * something else.
     */
    cycleTitle?: (params: { cycle: CYCLE }, config: CouponConfigRequiredProps) => ReactNode;
};

type FirstParam<T> = T extends (first: infer P, ...args: any[]) => any ? P : never;
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

export type CyclePriceCompareFirstParam = FirstParam<NonNullable<CouponConfig['cyclePriceCompare']>>;
export type CyclePriceCompareReturnType = ReturnType<NonNullable<CouponConfig['cyclePriceCompare']>>;

export type CycleTitleFirstParam = FirstParam<NonNullable<CouponConfig['cycleTitle']>>;
export type CycleTitleReturnType = ReturnType<NonNullable<CouponConfig['cycleTitle']>>;
