import { isPlan } from '@proton/shared/lib/payments/plan/helpers';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import type { ADDON_NAMES, PLANS } from '../../constants';
import type { FreeSubscription, PlanIDs } from '../../interface';
import type { Subscription } from '../interface';

type MaybeFreeSubscription = Subscription | FreeSubscription | null | undefined;

export function getPlanIDs(subscription: MaybeFreeSubscription): PlanIDs {
    return (subscription?.Plans || []).reduce<PlanIDs>((acc, { Name, Quantity }) => {
        acc[Name] = (acc[Name] || 0) + Quantity;
        return acc;
    }, {});
}

export const toPlanIDs = (selectedPlan: PLANS | ADDON_NAMES | PlanIDs | Plan): PlanIDs => {
    if (isPlan(selectedPlan)) {
        return { [selectedPlan.Name]: 1 };
    }

    if (typeof selectedPlan === 'string') {
        return { [selectedPlan]: 1 };
    }

    return selectedPlan;
};
