import { type PLANS } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { SubscriptionModel, SubscriptionPlan, UserModel } from '@proton/shared/lib/interfaces';

export type ConfigProps = {
    app?: APP_NAMES;
    plan: SubscriptionPlan & { Name: PLANS };
    subscription: SubscriptionModel;
    user: UserModel;
};

export type UpsellPlans = Partial<Record<APP_NAMES, PLANS>>;
