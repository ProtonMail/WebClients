export enum Renew {
    Disabled = 0,
    Enabled = 1,
}

export enum SubscriptionPlatform {
    Default = 0,
    iOS = 1,
    Android = 2,
}

export enum BillingPlatform {
    Proton = 0,
    Chargebee = 1,
}

export enum TaxInclusive {
    EXCLUSIVE = 0,
    INCLUSIVE = 1,
}

export enum SubscriptionMode {
    /**
     * The default mode. Also known as proration mode. If user has an active subscription and selects another plan, then
     * the new subscription will be partially paid with the prorated amount of the previous subscription. In this
     * subscription mode, the new subscription term starts immediately.
     */
    Regular = 0,
    /**
     * If user has an active subscription and wants to add an addon, then user will pay only for the addon. For example,
     * if user has 1 year subscription and after 4 months wants to add a member addon, then they will pay only for the 8
     * months of one member. In this subscription mode, we don't reset the existing subscription term.
     */
    CustomBillings = 1,
    /**
     * Creates a scheduled subscription. User fully pays for it in advance. The existing subscription continues as-is.
     * The scheduled subscription will start when the existing subscription ends.
     */
    ScheduledChargedImmediately = 2,
    /**
     * Same as ScheduledChargedImmediately, but user will be charged only when the scheduled subscription starts.
     */
    ScheduledChargedLater = 3,
    /**
     * With trials, we don't charge the user immediately. Instead, we wait for the trial to end and then switch to
     * the subscription.
     */
    Trial = 4,
}

export enum Audience {
    B2C = 'b2c',
    B2B = 'b2b',
    FAMILY = 'family',
}
