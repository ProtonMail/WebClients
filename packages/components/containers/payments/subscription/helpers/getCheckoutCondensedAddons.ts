import { PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { getHasPlusPlan } from '@proton/payments/core/plan/helpers';
import { type MaybeFreeSubscription, getPlanName } from '@proton/payments/core/subscription/helpers';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { FeatureFlagVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

export type CheckoutCondensedAddonsArm = 'control' | 'condensed';

export interface CheckoutCondensedAddonsParams {
    flagsReady: boolean;
    variant: FeatureFlagVariant<'CheckoutCondensedAddons'>;
    selectedPlanIDs: PlanIDs;
    latestSubscription: MaybeFreeSubscription;
    user: Pick<UserModel, 'canPay'>;
    isLiteApp: boolean;
}

/**
 * Checkout experiment CheckoutCondensedAddons: is this checkout in the experiment at all, whatever the variant?
 * Only Free or B2C Plus users upgrading to Proton Unlimited in the account app are. Users already on Duo, Family,
 * Visionary, Unlimited or B2B, and upgrades to any other plan, are not. Pass Lifetime is ignored.
 * bundle2022 is a B2C plan, and canPay is false for organization members, so neither needs its own check.
 */
export const getIsEligibleForCheckoutCondensedAddons = ({
    selectedPlanIDs,
    latestSubscription,
    user,
    isLiteApp,
}: Omit<CheckoutCondensedAddonsParams, 'flagsReady' | 'variant'>): boolean => {
    // Free users have no plan; Plus covers the single-product B2C plans (Mail, VPN, Pass, Drive, Lumo, Meet...).
    // Pass Lifetime is deliberately ignored: it is a one-time product, not a plan, so getPlanName never returns it
    // and the user is judged by their actual plan (Free if they have none).
    const currentPlanName = getPlanName(latestSubscription);
    const isOnFreeOrPlus = !currentPlanName || !!getHasPlusPlan(currentPlanName);

    return !!selectedPlanIDs[PLANS.BUNDLE] && isOnFreeOrPlus && user.canPay && !isLiteApp;
};

/**
 * Which arm this checkout gets. Anything other than an eligible checkout in the condensed variant (flag off, missing
 * or unknown variant, ineligible user or plan) stays on control.
 */
export const getCheckoutCondensedAddons = ({
    flagsReady,
    variant,
    ...rest
}: CheckoutCondensedAddonsParams): CheckoutCondensedAddonsArm =>
    flagsReady && variant.name === 'condensed' && getIsEligibleForCheckoutCondensedAddons(rest)
        ? 'condensed'
        : 'control';
