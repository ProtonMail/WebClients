import { type FreeSubscription, type SavedPaymentMethod, type Subscription, isTrial } from '@proton/payments/index';

export function getPaymentMethodRequired({
    amount,
    startTrial,
    subscription,
    savedPaymentMethods,
}: {
    amount: number;
    startTrial: boolean | undefined;
    subscription: Subscription | FreeSubscription | undefined;
    savedPaymentMethods: SavedPaymentMethod[] | undefined;
}): boolean {
    const hasSavedPaymentMethods = !!savedPaymentMethods?.length;

    // We must display payment method selector when amount due is greater than 0: if user doesn't have a saved payment
    // method, we need to collect it; if user has saved payment method, then we need to display it. But also we need to
    // display payment method selector when user wants to start a trial. We will not charge user in this case, but we
    // still want to save the payment method information. Additionally, user might want to modify existing trial
    // subscription. In this case we will collect the payment data if we don't have it yet.
    return amount > 0 || !!startTrial || (isTrial(subscription) && !hasSavedPaymentMethods);
}
