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
 * Checkout experiment CheckoutCondensedAddons: only Free or B2C Plus users upgrading to Proton Unlimited in the
 * account app can get the condensed layout. Anything else (flag off, missing or unknown variant, other target plans,
 * users already on Pass Lifetime, Duo, Family, Visionary, Unlimited or B2B) stays on control.
 * bundle2022 is a B2C plan, and canPay is false for organization members, so neither needs its own check.
 */
export const getCheckoutCondensedAddons = ({
    flagsReady,
    variant,
    selectedPlanIDs,
    latestSubscription,
    user,
    isLiteApp,
}: CheckoutCondensedAddonsParams): CheckoutCondensedAddonsArm => {
    // Free users have no plan; Plus covers the single-product B2C plans (Mail, VPN, Pass, Drive, Lumo, Meet...).
    // Pass Lifetime is deliberately ignored: it is a one-time product, not a plan, so getPlanName never returns it
    // and the user is judged by their actual plan (Free if they have none).
    const currentPlanName = getPlanName(latestSubscription);
    const isOnFreeOrPlus = !currentPlanName || !!getHasPlusPlan(currentPlanName);

    const isEligible =
        flagsReady &&
        variant.name === 'condensed' &&
        !!selectedPlanIDs[PLANS.BUNDLE] &&
        isOnFreeOrPlus &&
        user.canPay &&
        !isLiteApp;

    return isEligible ? 'condensed' : 'control';
};
