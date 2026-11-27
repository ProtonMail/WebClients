import { PLANS } from '@proton/payments/core/constants';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { isTrial } from '@proton/payments/core/subscription/helpers';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';

/**
 * The Pass Professional trial that Pass B2B signups get without a card: it doesn't renew and has no payment method
 * on file, so the admin still has to choose between subscribing and going back to Pass Basic.
 */
export const isAutoAssignedPassProfessionalTrial = (
    subscription: MaybeFreeSubscription,
    hasPaymentMethod: boolean
): boolean =>
    isTrial(subscription, PLANS.PASS_BUSINESS) &&
    isPaidSubscription(subscription) &&
    subscription.Renew === Renew.Disabled &&
    !hasPaymentMethod;
