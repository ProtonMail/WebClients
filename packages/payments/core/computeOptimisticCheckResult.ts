import { getOptimisticCheckResult } from './checkout';
import { computeOptimisticRenewProperties } from './computeOptimisticRenewProperties';
import { computeOptimisticSubscriptionMode } from './optimisticSubscriptionMode';
import type { Subscription, SubscriptionEstimation } from './subscription/interface';

export function computeOptimisticCheckResult(
    params: Parameters<typeof getOptimisticCheckResult>[0],
    subscription: Subscription | undefined,
    options: {
        isTrial?: boolean;
    }
): SubscriptionEstimation {
    const subscriptionMode = computeOptimisticSubscriptionMode(params, subscription, options);
    const optimisticCheckResult = getOptimisticCheckResult(params);
    optimisticCheckResult.SubscriptionMode = subscriptionMode;

    const optimisticRenewProperties = computeOptimisticRenewProperties(params);

    return {
        ...optimisticCheckResult,
        ...optimisticRenewProperties,
    };
}
