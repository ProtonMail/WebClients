import type { Currency, MaxKeys, PaymentMethodFlow } from './interface';

export enum PAYMENT_TOKEN_STATUS {
    STATUS_PENDING = 0,
    STATUS_CHARGEABLE = 1,
    STATUS_FAILED = 2,
    STATUS_CONSUMED = 3,
    STATUS_NOT_SUPPORTED = 4,
}

export enum PAYMENT_METHOD_TYPES {
    CARD = 'card',
    PAYPAL = 'paypal',
    BITCOIN = 'bitcoin',
    CHARGEBEE_BITCOIN = 'chargebee-bitcoin',
    CASH = 'cash',
    TOKEN = 'token',
    CHARGEBEE_CARD = 'chargebee-card',
    CHARGEBEE_PAYPAL = 'chargebee-paypal',
    CHARGEBEE_SEPA_DIRECT_DEBIT = 'sepa-direct-debit',
    APPLE_PAY = 'apple-pay',
}
export const signupFlows: readonly PaymentMethodFlow[] = Object.freeze([
    'signup',
    'signup-pass',
    'signup-pass-upgrade',
    'signup-wallet',
    'signup-vpn',
    'signup-v2',
    'signup-v2-upgrade',
]);
export enum Autopay {
    DISABLE = 0,
    ENABLE = 1,
}

export enum MethodStorage {
    INTERNAL = 0,
    EXTERNAL = 1,
}

export enum INVOICE_TYPE {
    OTHER = 0,
    SUBSCRIPTION = 1,
    CANCELLATION = 2,
    CREDIT = 3,
    DONATION = 4,
    CHARGEBACK = 5,
    RENEWAL = 6,
    REFUND = 7,
    MODIFICATION = 8,
    ADDITION = 9,
    CURRENCY_CONVERSION = 10,
    // Type 11 is an internal invoice type used for the migration. It's not supposed to be used by the frontend.
    PRODUCT = 12,
}

export enum INVOICE_STATE {
    UNPAID = 0,
    PAID = 1,
    VOID = 2,
    BILLED = 3,
    WRITEOFF = 4,
}

export enum INVOICE_OWNER {
    USER = 0,
    ORGANIZATION = 1,
}

export enum TransactionState {
    SUCCESS = 0,
    VOIDED = 1,
    FAILURE = 2,
    TIMEOUT = 3,
    NEEDS_ATTENTION = 4,
    REFUNDED = 5,
    CHARGEBACK = 6,
}

export enum TransactionType {
    AUTHORIZATION = 0,
    PAYMENT = 1,
    REFUND = 2,
    PAYMENT_REVERSAL = 3,
    CURRENCY_CONVERSION = 4,
    CREDIT = 5,
    GIFT_CARD = 6,
    BANK_TRANSFER = 7,
    BITCOIN = 8,
    CASH = 9,
    CHARGEBACK = 10,
    CREDIT_TRANSFER = 11,
    MIGRATION = 12,
    ADJUSTMENT_CREDIT = 13,
}

export enum ADDON_PREFIXES {
    MEMBER = '1member',
    DOMAIN = '1domain',
    IP = '1ip',
    SCRIBE = '1scribe',
    LUMO = '1lumo',
}

export enum ADDON_NAMES {
    MEMBER_DRIVE_PRO = `${ADDON_PREFIXES.MEMBER}-drivepro2022`,
    MEMBER_DRIVE_BUSINESS = `${ADDON_PREFIXES.MEMBER}-drivebiz2024`,
    MEMBER_MAIL_PRO = `${ADDON_PREFIXES.MEMBER}-mailpro2022`,
    MEMBER_MAIL_BUSINESS = `${ADDON_PREFIXES.MEMBER}-mailbiz2024`,
    MEMBER_BUNDLE_PRO = `${ADDON_PREFIXES.MEMBER}-bundlepro2022`,
    MEMBER_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.MEMBER}-bundlepro2024`,
    DOMAIN_BUNDLE_PRO = `${ADDON_PREFIXES.DOMAIN}-bundlepro2022`,
    DOMAIN_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.DOMAIN}-bundlepro2024`,
    MEMBER_ENTERPRISE = `${ADDON_PREFIXES.MEMBER}-enterprise2022`,
    DOMAIN_ENTERPRISE = `${ADDON_PREFIXES.DOMAIN}-enterprise2022`,
    MEMBER_VPN_PRO = `${ADDON_PREFIXES.MEMBER}-vpnpro2023`,
    MEMBER_VPN_BUSINESS = `${ADDON_PREFIXES.MEMBER}-vpnbiz2023`,
    IP_VPN_BUSINESS = `${ADDON_PREFIXES.IP}-vpnbiz2023`,
    IP_BUNDLE_PRO = `${ADDON_PREFIXES.IP}-bundlepro2022`,
    IP_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.IP}-bundlepro2024`,
    MEMBER_PASS_PRO = `${ADDON_PREFIXES.MEMBER}-passpro2024`,
    MEMBER_PASS_BUSINESS = `${ADDON_PREFIXES.MEMBER}-passbiz2024`,
    MEMBER_SCRIBE_MAIL_BUSINESS = `${ADDON_PREFIXES.SCRIBE}-mailbiz2024`,
    MEMBER_SCRIBE_MAIL_PRO = `${ADDON_PREFIXES.SCRIBE}-mailpro2022`,
    MEMBER_SCRIBE_BUNDLE_PRO = `${ADDON_PREFIXES.SCRIBE}-bundlepro2022`,
    MEMBER_SCRIBE_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.SCRIBE}-bundlepro2024`,
    LUMO_MAIL = `${ADDON_PREFIXES.LUMO}-mail2022`,
    LUMO_DRIVE = `${ADDON_PREFIXES.LUMO}-drive2022`,
    LUMO_DRIVE_1TB = `${ADDON_PREFIXES.LUMO}-drive1tb2025`,
    LUMO_PASS = `${ADDON_PREFIXES.LUMO}-pass2023`,
    LUMO_PASS_FAMILY = `${ADDON_PREFIXES.LUMO}-passfamily2024`,
    LUMO_VPN = `${ADDON_PREFIXES.LUMO}-vpn2022`,
    LUMO_VPN2024 = `${ADDON_PREFIXES.LUMO}-vpn2024`,
    LUMO_BUNDLE = `${ADDON_PREFIXES.LUMO}-bundle2022`,
    LUMO_FAMILY = `${ADDON_PREFIXES.LUMO}-family2022`,
    LUMO_DUO = `${ADDON_PREFIXES.LUMO}-duo2024`,
    LUMO_MAIL_PRO = `${ADDON_PREFIXES.LUMO}-mailpro2022`,
    LUMO_MAIL_BUSINESS = `${ADDON_PREFIXES.LUMO}-mailbiz2024`,
    LUMO_DRIVE_PRO = `${ADDON_PREFIXES.LUMO}-drivepro2022`,
    LUMO_DRIVE_BUSINESS = `${ADDON_PREFIXES.LUMO}-drivebiz2024`,
    LUMO_BUNDLE_PRO = `${ADDON_PREFIXES.LUMO}-bundlepro2022`,
    LUMO_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.LUMO}-bundlepro2024`,
    LUMO_VPN_PRO = `${ADDON_PREFIXES.LUMO}-vpnpro2023`,
    LUMO_VPN_BUSINESS = `${ADDON_PREFIXES.LUMO}-vpnbiz2023`,
    LUMO_PASS_PRO = `${ADDON_PREFIXES.LUMO}-passpro2024`,
    LUMO_PASS_BUSINESS = `${ADDON_PREFIXES.LUMO}-passbiz2024`,
}

export enum PLANS {
    FREE = 'free',
    DRIVE = 'drive2022',
    DRIVE_1TB = 'drive1tb2025',
    DRIVE_PRO = 'drivepro2022',
    DRIVE_BUSINESS = 'drivebiz2024',
    DRIVE_LITE = 'drivelite2024',
    PASS = 'pass2023',
    MAIL = 'mail2022',
    MAIL_PRO = 'mailpro2022',
    MAIL_BUSINESS = 'mailbiz2024',
    /**
     * @deprecated.
     * Unless you know exactly what you are doing, don't use this plan. The new VPN plan is VPN2024.
     */
    VPN = 'vpn2022',
    VPN2024 = 'vpn2024',
    WALLET = 'wallet2024',
    BUNDLE = 'bundle2022',
    /**
     * @deprecated.
     * Unless you know exactly what you are doing, don't use this plan. The new bundle pro plan is BUNDLE_PRO_2024.
     */
    BUNDLE_PRO = 'bundlepro2022',
    BUNDLE_PRO_2024 = 'bundlepro2024',
    ENTERPRISE = 'enterprise2022',
    FAMILY = 'family2022',
    DUO = 'duo2024',
    VISIONARY = 'visionary2022',
    VPN_PRO = 'vpnpro2023',
    VPN_BUSINESS = 'vpnbiz2023',
    VPN_PASS_BUNDLE = 'vpnpass2023',
    PASS_PRO = 'passpro2024',
    PASS_BUSINESS = 'passbiz2024',
    PASS_FAMILY = 'passfamily2024',
    PASS_LIFETIME = 'passlifetime2024',
    LUMO = 'lumo2024',
}

export const AddonKey: Readonly<{
    [K in ADDON_NAMES]: MaxKeys;
}> = {
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 'MaxDomains',
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 'MaxDomains',
    [ADDON_NAMES.DOMAIN_ENTERPRISE]: 'MaxDomains',
    [ADDON_NAMES.MEMBER_MAIL_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_DRIVE_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_DRIVE_BUSINESS]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_ENTERPRISE]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_VPN_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 'MaxMembers',
    [ADDON_NAMES.IP_VPN_BUSINESS]: 'MaxIPs',
    [ADDON_NAMES.IP_BUNDLE_PRO]: 'MaxIPs',
    [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 'MaxIPs',
    [ADDON_NAMES.MEMBER_PASS_PRO]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_PASS_BUSINESS]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 'MaxMembers',
    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 'MaxAI',
    [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO]: 'MaxAI',
    [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 'MaxAI',
    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 'MaxAI',
    [ADDON_NAMES.LUMO_MAIL]: 'MaxLumo',
    [ADDON_NAMES.LUMO_DRIVE]: 'MaxLumo',
    [ADDON_NAMES.LUMO_DRIVE_1TB]: 'MaxLumo',
    [ADDON_NAMES.LUMO_PASS]: 'MaxLumo',
    [ADDON_NAMES.LUMO_PASS_FAMILY]: 'MaxLumo',
    [ADDON_NAMES.LUMO_VPN]: 'MaxLumo',
    [ADDON_NAMES.LUMO_VPN2024]: 'MaxLumo',
    [ADDON_NAMES.LUMO_BUNDLE]: 'MaxLumo',
    [ADDON_NAMES.LUMO_FAMILY]: 'MaxLumo',
    [ADDON_NAMES.LUMO_DUO]: 'MaxLumo',
    [ADDON_NAMES.LUMO_MAIL_PRO]: 'MaxLumo',
    [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 'MaxLumo',
    [ADDON_NAMES.LUMO_DRIVE_PRO]: 'MaxLumo',
    [ADDON_NAMES.LUMO_DRIVE_BUSINESS]: 'MaxLumo',
    [ADDON_NAMES.LUMO_BUNDLE_PRO]: 'MaxLumo',
    [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 'MaxLumo',
    [ADDON_NAMES.LUMO_VPN_PRO]: 'MaxLumo',
    [ADDON_NAMES.LUMO_VPN_BUSINESS]: 'MaxLumo',
    [ADDON_NAMES.LUMO_PASS_PRO]: 'MaxLumo',
    [ADDON_NAMES.LUMO_PASS_BUSINESS]: 'MaxLumo',
} as const;

// Max quantity for all addons
export const MAX_VPN_ADDON = 2000;
export const MAX_MEMBER_ADDON = 5000;
export const MAX_MEMBER_SCRIBE_ADDON = 5000;
export const MAX_DOMAIN_PRO_ADDON = 200;
export const MAX_DOMAIN_PLUS_ADDON = 10;
export const MAX_ADDRESS_ADDON = 10;
export const MAX_LUMO_ADDON = 1;
export const MAX_MEMBER_LUMO_ADDON = 5000;
// VPN B2B limits
export const MAX_MEMBER_VPN_B2B_ADDON = 5000;
export const MAX_IPS_ADDON = 100;
// Pass B2B member limits (only hardcoded FE side not BE side, and only applicable to new subscriptions)
export const MIN_MEMBER_PASS_B2B_ADDON = 3;
export const MAX_MEMBER_PASS_PRO_ADDON = 30;

// B2B Trial constants
export const TRIAL_DURATION_DAYS = 14; // ideally we would use the BE as the source of truth, but we hardcoded it here and there

// B2B Trial limits, currently only used for B2B Trials
// Hardcoded FE side. Protections will (as of 2025-06-18) be added on the BE side too.
export const TRIAL_MAX_USERS = 10;
export const TRIAL_MAX_SCRIBE_SEATS = 10;
export const TRIAL_MAX_LUMO_SEATS = 10;
export const TRIAL_MAX_DEDICATED_IPS = 1;
export const TRIAL_MAX_EXTRA_CUSTOM_DOMAINS = 0;

export const AddonLimit: { [key in ADDON_NAMES]: number } = {
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: MAX_DOMAIN_PRO_ADDON,
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: MAX_DOMAIN_PRO_ADDON,
    [ADDON_NAMES.DOMAIN_ENTERPRISE]: MAX_DOMAIN_PRO_ADDON,
    [ADDON_NAMES.MEMBER_MAIL_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_DRIVE_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_DRIVE_BUSINESS]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_ENTERPRISE]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_VPN_PRO]: MAX_MEMBER_VPN_B2B_ADDON,
    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: MAX_MEMBER_VPN_B2B_ADDON,
    [ADDON_NAMES.IP_VPN_BUSINESS]: MAX_IPS_ADDON,
    [ADDON_NAMES.IP_BUNDLE_PRO]: MAX_IPS_ADDON,
    [ADDON_NAMES.IP_BUNDLE_PRO_2024]: MAX_IPS_ADDON,
    [ADDON_NAMES.MEMBER_PASS_PRO]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_PASS_BUSINESS]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: MAX_MEMBER_ADDON,
    [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO]: MAX_IPS_ADDON,
    [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: MAX_IPS_ADDON,
    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: MAX_IPS_ADDON,
    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: MAX_IPS_ADDON,
    [ADDON_NAMES.LUMO_MAIL]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_DRIVE]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_DRIVE_1TB]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_PASS]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_PASS_FAMILY]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_VPN]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_VPN2024]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_BUNDLE]: MAX_LUMO_ADDON,
    [ADDON_NAMES.LUMO_FAMILY]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_DUO]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_MAIL_PRO]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_MAIL_BUSINESS]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_DRIVE_PRO]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_DRIVE_BUSINESS]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_BUNDLE_PRO]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_VPN_PRO]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_VPN_BUSINESS]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_PASS_PRO]: MAX_MEMBER_LUMO_ADDON,
    [ADDON_NAMES.LUMO_PASS_BUSINESS]: MAX_MEMBER_LUMO_ADDON,
} as const;

export const PLAN_NAMES: { [key in PLANS]: string } = {
    [PLANS.FREE]: 'Free',
    [PLANS.VPN2024]: 'VPN Plus',
    [PLANS.DRIVE]: 'Drive Plus 200 GB',
    [PLANS.DRIVE_1TB]: 'Drive Plus 1 TB',
    [PLANS.DRIVE_PRO]: 'Drive Essentials',
    [PLANS.DRIVE_BUSINESS]: 'Drive Professional',
    [PLANS.DRIVE_LITE]: 'Drive Lite',
    [PLANS.PASS]: 'Pass Plus',
    [PLANS.MAIL]: 'Mail Plus',
    [PLANS.MAIL_PRO]: 'Mail Essentials',
    [PLANS.MAIL_BUSINESS]: 'Mail Professional',
    [PLANS.VPN]: 'VPN Plus',
    [PLANS.WALLET]: 'Wallet Plus',
    [PLANS.LUMO]: 'Lumo Plus',
    [PLANS.BUNDLE]: 'Proton Unlimited',
    [PLANS.BUNDLE_PRO]: 'Proton Business Suite',
    [PLANS.BUNDLE_PRO_2024]: 'Proton Business Suite',
    [PLANS.ENTERPRISE]: 'Enterprise',
    [PLANS.FAMILY]: 'Proton Family',
    [PLANS.DUO]: 'Proton Duo',
    [PLANS.VISIONARY]: 'Proton Visionary',
    [PLANS.VPN_PRO]: 'VPN Essentials',
    [PLANS.VPN_BUSINESS]: 'VPN Professional',
    [PLANS.VPN_PASS_BUNDLE]: 'VPN and Pass bundle',
    [PLANS.PASS_PRO]: 'Pass Essentials',
    [PLANS.PASS_BUSINESS]: 'Pass Professional',
    [PLANS.PASS_FAMILY]: 'Pass Family',
    [PLANS.PASS_LIFETIME]: 'Pass + SimpleLogin Lifetime',
};

export enum PLAN_TYPES {
    ADDON = 0,
    PLAN = 1,
    // Example of product: Pass Lifetime.
    // Unlike Plans, buying products doesn't create subscription in the DB. Instead, user is charged one time.
    // Still, GET subscription will pretend that the actual subscription exists, but the key detail will be an
    // account-wide entitlement.
    PRODUCT = 2,
}

export enum PLAN_SERVICES {
    MAIL = 1,
    DRIVE = 2,
    VPN = 4,
    PASS = 8,
}

export enum CurrencySymbols {
    USD = 'US$',
    AUD = 'AU$',
    CAD = 'CA$',
    EUR = '€',
    GBP = '£',
    CHF = 'CHF',
    BRL = 'BRL',
}

export const CURRENCIES = Object.keys(CurrencySymbols) as readonly (keyof typeof CurrencySymbols)[];

export const DEFAULT_CURRENCY = 'EUR' as Currency;

export const MIN_CREDIT_AMOUNT = 500;
export const MAX_CREDIT_AMOUNT = 4000000;
export const MIN_BITCOIN_AMOUNT = 499;
export const MAX_BITCOIN_AMOUNT = MAX_CREDIT_AMOUNT;
export const MIN_PAYPAL_AMOUNT_INHOUSE = 499;
export const MIN_PAYPAL_AMOUNT_CHARGEBEE = 100;
export const MAX_PAYPAL_AMOUNT = 99999900;
export const MIN_APPLE_PAY_AMOUNT = 100;

export const FREE_SUBSCRIPTION = {
    isFreeSubscription: true,
    Plans: undefined,
    Currency: undefined,
    CouponCode: undefined,
    Cycle: undefined,
    UpcomingSubscription: undefined,
    PeriodEnd: undefined,
    Amount: undefined,
};

export enum CYCLE {
    MONTHLY = 1,
    THREE = 3,
    SIX = 6,
    YEARLY = 12,
    FIFTEEN = 15,
    EIGHTEEN = 18,
    TWO_YEARS = 24,
    THIRTY = 30,
}

export const DEFAULT_CYCLE = CYCLE.YEARLY;

export enum COUPON_CODES {
    PORKBUN = 'PORKBUN',

    BLACK_FRIDAY_2023 = 'BF2023',
    BLACK_FRIDAY_2024 = 'BF2024YR',
    BLACK_FRIDAY_2024_MONTH = 'BF2024MO',
    BLACK_FRIDAY_2024_PCMAG = 'BF2024PCMAG',
    BLACK_FRIDAY_2024_HB = 'BF2024HB',
    BLACK_FRIDAY_2024_VPNLIGHTNING = 'BF2024VPNLIGHTNING',
    BLACK_FRIDAY_2024_PASS_LIFE = 'BF2024PASSLIFE',

    // Monthy user nudge
    ANNUALOFFER25 = 'ANNUALOFFER25',

    // DEGOOGLE 2024 Campain
    DEGOOGLE = 'DEGOOGLE',

    LIFETIME = 'LIFETIME',
    END_OF_YEAR_2023 = 'EOY2023',
    END_OF_YEAR_2024 = 'EOY2024',
    EOY_2023_1M_INTRO = 'EOY1MINTRO',
    VPN_INTRO_2024 = 'VPNINTROPRICE2024',
    VPN_VIVALDI = 'VIVALDIVPN',
    MARCHSAVINGS24 = 'MARCHSAVINGS24',
    HONEYPROTONSAVINGS = 'HONEYPROTONSAVINGS',
    TRYMAILPLUS2024 = 'TRYMAILPLUS2024',
    MAILPLUSINTRO = 'MAILPLUSINTRO',
    TRYVPNPLUS2024 = 'TRYVPNPLUS2024',
    PREMIUM_DEAL = 'PREMIUM_DEAL',
    TRYDRIVEPLUS2024 = 'DRIVEPLUSINTRO2024',
    PASSPLUSINTRO2024 = 'PASSPLUSINTRO2024',
    //
    TECHRADARVPNPASS = 'TECHRADARVPNPASS',
    CNETVPNPASS = 'CNETVPNPASS',
    ZDNETVPNPASS = 'ZDNETVPNPASS',
    RESTOREPRIVACYVPNPASS = 'RESTOREPRIVACYVPNPASS',
    ENGADGETVPNPASS = 'ENGADGETVPNPASS',
    COMPARITECHVPNPASS = 'COMPARITECHVPNPASS',
    PROPRIVACYVPNPASS = 'PROPRIVACYVPNPASS',
    BLEEPINGCOMPUTERVPNPASS = 'BLEEPINGCOMPUTERVPNPASS',
    PCMAGVPNPASS = 'PCMAGVPNPASS',
    /** 1$ offer */
    TRYMAILPLUS0724 = 'TRYMAILPLUS0724',
    /** PassFamily Promo */
    PASSEARLYSUPPORTER = 'PASSEARLYSUPPORTER',
    PASSFAMILYLAUNCH = 'PASSFAMILYLAUNCH',

    /** Proton Anniversary 11 */
    PROTONBDAYSALE25 = 'PROTONBDAYSALE25', // Used by website only
    PROTONBDAYSALEB25 = 'PROTONBDAYSALEB25',
    COMMUNITYSPECIALDEAL25 = 'COMMUNITYSPECIALDEAL25',
    B2C2BPRO = 'B2C2BPRO',

    TLDRPROMO072025 = 'TLDRPROMO072025',
}

export const VPN_PASS_PROMOTION_COUPONS = [
    COUPON_CODES.TECHRADARVPNPASS,
    COUPON_CODES.CNETVPNPASS,
    COUPON_CODES.ZDNETVPNPASS,
    COUPON_CODES.RESTOREPRIVACYVPNPASS,
    COUPON_CODES.ENGADGETVPNPASS,
    COUPON_CODES.COMPARITECHVPNPASS,
    COUPON_CODES.PROPRIVACYVPNPASS,
    COUPON_CODES.BLEEPINGCOMPUTERVPNPASS,
    COUPON_CODES.PCMAGVPNPASS,
];
