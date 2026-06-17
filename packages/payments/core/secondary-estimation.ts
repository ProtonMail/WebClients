import type { CheckSubscriptionData } from './api/api';
import { getOptimisticCheckResult } from './checkout';
import type { ADDON_PREFIXES } from './constants';
import type { PaymentsApi } from './interface';
import { getAddonNameByPlan, getPlanNameFromIDs } from './plan/helpers';
import type { PlansMap } from './plan/interface';
import type { SubscriptionEstimation } from './subscription/interface';

export interface RunSecondarySubscriptionEstimationParams {
    /** The primary check payload (the plan the user is currently looking at). */
    checkPayload: CheckSubscriptionData;
    plansMap: PlansMap;
    paymentsApi: Pick<PaymentsApi, 'checkSubscription'>;
    /** Which addon family to add to the secondary estimation (e.g. LUMO, MEET, IP). */
    addonPrefix: ADDON_PREFIXES;
    /** How many seats of the addon to add. Defaults to 1; pass > 1 to estimate multiple seats. */
    quantity?: number;
    signal?: AbortSignal;
}

/**
 * Runs a *secondary* subscription estimation: it takes the primary check payload, adds `quantity` seats of the
 * given addon, and asks the backend for the resulting estimation.
 *
 * A valid coupon already yields a {@link CouponDiscountBreakdown} on the *primary* check, but only for whatever
 * that check included. When the user's current estimation has the coupon WITHOUT a given addon, that breakdown
 * can't tell us what the discount would be if the addon were added. The only way to learn it is to run a second
 * check with the coupon AND the addon included — which is exactly what this helper does. UIs that compare a base
 * plan against the same plan *with addons* (addon upsell banners, with-addon discount line items) depend on it.
 *
 * Returns the estimation, or `null` if the addon doesn't apply to the selected plan or the check fails. When the
 * payload carries no coupon codes, an optimistic (discount-free) estimation is returned without hitting the API.
 */
export async function runSecondarySubscriptionEstimation({
    checkPayload,
    plansMap,
    paymentsApi,
    addonPrefix,
    quantity = 1,
    signal,
}: RunSecondarySubscriptionEstimationParams): Promise<SubscriptionEstimation | null> {
    const selectedPlanName = getPlanNameFromIDs(checkPayload.Plans);
    if (!selectedPlanName) {
        return null;
    }

    const addonName = getAddonNameByPlan(addonPrefix, selectedPlanName);
    if (!addonName) {
        return null;
    }

    const planIDsWithAddon = {
        ...checkPayload.Plans,
        [addonName]: quantity,
    };

    const noCoupons = !checkPayload.Codes || checkPayload.Codes.length === 0;
    if (noCoupons) {
        return getOptimisticCheckResult({
            planIDs: planIDsWithAddon,
            plansMap,
            currency: checkPayload.Currency,
            cycle: checkPayload.Cycle,
        });
    }

    const payloadWithAddon: CheckSubscriptionData = {
        ...checkPayload,
        Plans: planIDsWithAddon,
    };

    try {
        return await paymentsApi.checkSubscription(payloadWithAddon, { signal });
    } catch {
        return null;
    }
}
