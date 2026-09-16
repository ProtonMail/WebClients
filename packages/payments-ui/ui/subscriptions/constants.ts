export const subscriptionModalClassName = 'subscription-modal' as const;

export enum SUBSCRIPTION_STEPS {
    NETWORK_ERROR = 0,
    PLAN_SELECTION = 1,
    CHECKOUT = 2,
    UPGRADE = 3,
    THANKS = 4,
}
