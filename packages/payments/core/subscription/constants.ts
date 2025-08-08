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
    Regular = 0,
    CustomBillings = 1,
    ScheduledChargedImmediately = 2,
    ScheduledChargedLater = 3,
    Trial = 4,
}

export enum Audience {
    B2C = 'b2c',
    B2B = 'b2b',
    FAMILY = 'family',
}
