import type { FreeSubscription } from './interface';
import type { MaybeFreeSubscription, Subscription } from './subscription/interface';

export function isFreeSubscription(obj: any): obj is FreeSubscription {
    return !!obj && obj.isFreeSubscription && Object.keys(obj).filter((key) => obj[key] !== undefined).length === 1;
}

export function isPaidSubscription(subscription: MaybeFreeSubscription | null): subscription is Subscription {
    return !!subscription && !isFreeSubscription(subscription);
}
