import type { CheckSubscriptionData } from '../api/api';
import { type BillingAddress, getBillingAddressPayload } from '../billing-address/billing-address';
import type { Currency, Cycle, PlanIDs } from '../interface';
import { getAutoCoupon, getOfferOrCodes } from './helpers';

export interface PlanToCheck {
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    coupon?: string;
    offer?: string;
    groupId?: string;
    trial?: boolean;
}

export const getSubscriptionDataFromPlanToCheck = ({
    planIDs,
    cycle,
    currency,
    coupon,
    offer,
    trial = false,
    ValidateBillingAddress,
    VatId,
    BillingAddress,
}: PlanToCheck & {
    ValidateBillingAddress?: boolean;
    VatId: string | undefined;
    BillingAddress: BillingAddress;
}): CheckSubscriptionData => ({
    Plans: planIDs,
    Currency: currency,
    Cycle: cycle,
    ...getOfferOrCodes({ offer, codes: coupon ? [coupon] : [] }),
    BillingAddress: getBillingAddressPayload({
        billingAddress: BillingAddress,
        vatId: VatId,
    }),
    ValidateBillingAddress,
    IsTrial: trial,
    VatId,
});

export function getPlanToCheck(params: PlanToCheck): PlanToCheck {
    if (params.offer?.trim()) {
        return params;
    }

    const coupon = getAutoCoupon({
        coupon: params.coupon,
        planIDs: params.planIDs,
        cycle: params.cycle,
        trial: params.trial,
        currency: params.currency,
    });

    return { ...params, coupon };
}
