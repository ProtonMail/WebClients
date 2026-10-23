import { PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import {
    type MaybeFreeSubscription,
    getIsB2BAudienceFromSubscription,
} from '@proton/payments/core/subscription/helpers';
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
 * Checkout experiment CheckoutCondensedAddons: only B2C Proton Unlimited checkouts in the account app can get the
 * condensed layout. Anything else (flag off, missing or unknown variant, other plans, B2B) stays on control.
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
    const isEligible =
        flagsReady &&
        variant.name === 'condensed' &&
        !!selectedPlanIDs[PLANS.BUNDLE] &&
        !getIsB2BAudienceFromSubscription(latestSubscription) &&
        user.canPay &&
        !isLiteApp;

    return isEligible ? 'condensed' : 'control';
};
