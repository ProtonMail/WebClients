import { SubscriptionMode } from './subscription/constants';
import type { SubscriptionEstimation } from './subscription/interface';

export interface CheckoutModifiers {
    isProration: boolean;
    isScheduledChargedImmediately: boolean;
    isScheduledChargedLater: boolean;
    isScheduled: boolean;
    isCustomBilling: boolean;
}

export const getCheckoutModifiers = (checkResult: SubscriptionEstimation): CheckoutModifiers => {
    if (checkResult.optimistic) {
        return {
            isProration: false,
            isScheduledChargedImmediately: false,
            isScheduledChargedLater: false,
            isScheduled: false,
            isCustomBilling: false,
        };
    }

    const isScheduledChargedImmediately = checkResult.SubscriptionMode === SubscriptionMode.ScheduledChargedImmediately;
    const isScheduledChargedLater = checkResult.SubscriptionMode === SubscriptionMode.ScheduledChargedLater;
    const isScheduled = isScheduledChargedImmediately || isScheduledChargedLater;

    return {
        isProration: checkResult.SubscriptionMode === SubscriptionMode.Regular,
        isScheduledChargedImmediately,
        isScheduledChargedLater,
        isScheduled,
        isCustomBilling: checkResult.SubscriptionMode === SubscriptionMode.CustomBillings,
    };
};
