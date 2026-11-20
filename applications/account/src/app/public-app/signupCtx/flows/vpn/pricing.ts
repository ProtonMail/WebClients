import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency, Cycle, PlanIDs } from '@proton/payments/core/interface';
import { getIsVPNPassPromotion } from '@proton/payments/core/subscription/helpers';
import { type PlanToCheck, getPlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import isTruthy from '@proton/utils/isTruthy';

interface Selection {
    planIDs: PlanIDs;
    cycle: Cycle;
    currency: Currency | undefined;
    coupon: string | undefined;
}

/** The VPN+Pass promotion coupon only applies to the VPN+Pass bundle on 12 months: other selections go without it. */
export const getVpnCoupon = ({ planIDs, cycle, currency, coupon }: Selection) => {
    const isPromotionBundle = !!planIDs[PLANS.VPN_PASS_BUNDLE] && cycle === CYCLE.YEARLY;
    return getIsVPNPassPromotion(coupon, currency) && !isPromotionBundle ? undefined : coupon;
};

/** A selection to check, with its coupon: the promotion's rule, then the automatic coupon if there's none. */
export const getVpnPlanToCheck = ({
    trial,
    ...selection
}: Selection & { currency: Currency; trial?: boolean }): PlanToCheck =>
    getPlanToCheck({ ...selection, coupon: getVpnCoupon(selection), trial });

/**
 * The plans the cycle selector, the upsell toggle and the VPN+Pass bundle upsell show prices for, and the Proton
 * Unlimited card of the VpnSignupThreePlans experiment
 */
const getVpnPlanIDsToShow = (planIDs: PlanIDs, withProtonUnlimited: boolean) =>
    [
        planIDs,
        !planIDs[PLANS.VPN2024] && { [PLANS.VPN2024]: 1 },
        !planIDs[PLANS.VPN_PASS_BUNDLE] && { [PLANS.VPN_PASS_BUNDLE]: 1 },
        withProtonUnlimited && !planIDs[PLANS.BUNDLE] && { [PLANS.BUNDLE]: 1 },
    ].filter(isTruthy);

/** The plans and cycles to check while the signup initializes, each with the coupon that applies to it */
export const getVpnAvailablePlans = ({
    planIDs,
    cycles,
    currency,
    coupon,
    withProtonUnlimited = false,
}: {
    planIDs: PlanIDs;
    cycles: Cycle[];
    currency: Currency | undefined;
    coupon: string | undefined;
    withProtonUnlimited?: boolean;
}) =>
    getVpnPlanIDsToShow(planIDs, withProtonUnlimited).flatMap((planIDs) =>
        cycles.map((cycle) => ({ planIDs, cycle, coupon: getVpnCoupon({ planIDs, cycle, currency, coupon }) }))
    );

/** What the cycle selector, the upsell toggle and the VPN+Pass bundle upsell show prices for. */
export const getVpnPlansToCheck = ({
    planIDs,
    cycles,
    currency,
    coupon,
    withProtonUnlimited = false,
}: {
    planIDs: PlanIDs;
    cycles: Cycle[];
    currency: Currency;
    coupon: string | undefined;
    withProtonUnlimited?: boolean;
}): PlanToCheck[] =>
    getVpnPlanIDsToShow(planIDs, withProtonUnlimited).flatMap((planIDs) =>
        cycles.map((cycle) => getVpnPlanToCheck({ planIDs, cycle, currency, coupon }))
    );
