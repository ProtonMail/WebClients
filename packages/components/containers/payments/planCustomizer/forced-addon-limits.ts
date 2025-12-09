import { PLANS } from '@proton/payments/core/constants';
import type { FeatureLimitKey, FreeSubscription } from '@proton/payments/core/interface';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { getHasPassB2BPlan } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';

type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

type EnforceWhenPredicate = (currentUserConditions: {
    subscription: Subscription | FreeSubscription | undefined;
    plansMap: PlansMap;
}) => boolean;

const passB2BMembersEnforcement = ({ min, max }: { min: number; max?: number }): EnforceWhenPredicate => {
    return ({ subscription, plansMap }) => {
        if (!getHasPassB2BPlan(subscription)) {
            return true;
        }

        const currentPlan = SelectedPlan.createFromSubscription(subscription, plansMap);
        const totalUsers = currentPlan.getTotalUsers();

        return totalUsers >= min && (!max || totalUsers <= max);
    };
};

/**
 * If you want to make sure that your plan includes at least specific number of users, IPs, etc. then you can use this
 * object to enforce that. This object should be used when your plan doesn't include certain addons, but at the same
 * time the frontend must make sure that user always buys them.
 */
const FORCED_FEATURE_LIMITATIONS: PartialRecord<
    PLANS,
    PartialRecord<
        FeatureLimitKey,
        {
            min?: number;
            max?: number;
            enforceWhen?: EnforceWhenPredicate;
        }
    >
> = {
    [PLANS.VPN_PASS_BUNDLE_BUSINESS]: {
        MaxMembers: {
            min: 3,
        },
        MaxIPs: {
            min: 1,
        },
    },
    [PLANS.PASS_PRO]: (() => {
        const min = 3;
        const max = 30;

        return {
            MaxMembers: {
                min,
                max,
            },
            enforceWhen: passB2BMembersEnforcement({ min, max }),
        };
    })(),
    [PLANS.PASS_BUSINESS]: (() => {
        const min = 3;

        return {
            MaxMembers: {
                min,
            },
            enforceWhen: passB2BMembersEnforcement({ min }),
        };
    })(),
};

export function getForcedFeatureLimitations({
    plan,
    featureLimitKey,
    subscription,
    plansMap,
}: {
    plan: PLANS;
    featureLimitKey: FeatureLimitKey;
    subscription: Subscription | FreeSubscription | undefined;
    plansMap: PlansMap;
}): {
    forcedMin?: number;
    forcedMax?: number;
} {
    const forcedFeatureLimitation = FORCED_FEATURE_LIMITATIONS[plan]?.[featureLimitKey];
    if (!forcedFeatureLimitation) {
        return {};
    }

    const { min: forcedMin, max: forcedMax } = forcedFeatureLimitation;

    if (forcedFeatureLimitation.enforceWhen && forcedFeatureLimitation.enforceWhen({ subscription, plansMap })) {
        return {
            forcedMin,
            forcedMax,
        };
    }

    return {
        forcedMin,
        forcedMax,
    };
}
