import type { FreeSubscription, PlanIDs } from '../../interface';
import type { Subscription } from '../interface';

type MaybeFreeSubscription = Subscription | FreeSubscription | null | undefined;

export function getPlanIDs(subscription: MaybeFreeSubscription): PlanIDs {
    return (subscription?.Plans || []).reduce<PlanIDs>((acc, { Name, Quantity }) => {
        acc[Name] = (acc[Name] || 0) + Quantity;
        return acc;
    }, {});
}
