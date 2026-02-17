import { getOptimisticCheckResult } from './checkout';
import { computeOptimisticRenewProperties } from './computeOptimisticRenewProperties';
import type { FreeSubscription } from './interface';
import { computeOptimisticSubscriptionMode } from './optimisticSubscriptionMode';
import type { EnrichedCheckResponse, Subscription } from './subscription/interface';

export function computeOptimisticCheckResult(
    params: Parameters<typeof getOptimisticCheckResult>[0],
    subscription: Subscription | FreeSubscription,
    options: {
        isTrial?: boolean;
    }
): EnrichedCheckResponse {
    const subscriptionMode = computeOptimisticSubscriptionMode(params, subscription, options);
    const optimisticCheckResult = getOptimisticCheckResult(params);
    optimisticCheckResult.SubscriptionMode = subscriptionMode;

    const optimisticRenewProperties = computeOptimisticRenewProperties(params);

    return {
        ...optimisticCheckResult,
        ...optimisticRenewProperties,
    };
}
