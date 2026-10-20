import type { PLANS } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { SubscriptionPlan } from '@proton/shared/lib/payments/plan/interface';
import type { Subscription } from '@proton/shared/lib/payments/subscription/interface';

export type ConfigProps = {
    app?: APP_NAMES;
    plan: SubscriptionPlan & { Name: PLANS };
    subscription: Subscription;
};

export type UpsellPlans = Partial<Record<APP_NAMES, PLANS>>;
