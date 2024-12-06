import type { Currency, MaxKeys, PaymentMethodFlows } from './interface';

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
    PAYPAL_CREDIT = 'paypal-credit',
    BITCOIN = 'bitcoin',
    CHARGEBEE_BITCOIN = 'chargebee-bitcoin',
    CASH = 'cash',
    TOKEN = 'token',
    CHARGEBEE_CARD = 'chargebee-card',
    CHARGEBEE_PAYPAL = 'chargebee-paypal',
    CHARGEBEE_SEPA_DIRECT_DEBIT = 'sepa_direct_debit',
}
export const signupFlows: readonly PaymentMethodFlows[] = Object.freeze([
    'signup',
    'signup-pass',
    'signup-pass-upgrade',
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

export enum UNPAID_STATE {
    NOT_UNPAID = 0,
    AVAILABLE = 1,
    OVERDUE = 2,
    DELINQUENT = 3,
    NO_RECEIVE = 4,
}

export const MEMBER_ADDON_PREFIX = '1member';
export const DOMAIN_ADDON_PREFIX = '1domain';
export const IP_ADDON_PREFIX = '1ip';
export const SCRIBE_ADDON_PREFIX = '1scribe';
export const LUMO_ADDON_PREFIX = '1lumo';

export enum ADDON_NAMES {
    MEMBER_DRIVE_PRO = `${MEMBER_ADDON_PREFIX}-drivepro2022`,
    MEMBER_DRIVE_BUSINESS = `${MEMBER_ADDON_PREFIX}-drivebiz2024`,
    MEMBER_MAIL_PRO = `${MEMBER_ADDON_PREFIX}-mailpro2022`,
    MEMBER_MAIL_BUSINESS = `${MEMBER_ADDON_PREFIX}-mailbiz2024`,
    MEMBER_BUNDLE_PRO = `${MEMBER_ADDON_PREFIX}-bundlepro2022`,
    MEMBER_BUNDLE_PRO_2024 = `${MEMBER_ADDON_PREFIX}-bundlepro2024`,
    DOMAIN_BUNDLE_PRO = `${DOMAIN_ADDON_PREFIX}-bundlepro2022`,
    DOMAIN_BUNDLE_PRO_2024 = `${DOMAIN_ADDON_PREFIX}-bundlepro2024`,
    MEMBER_ENTERPRISE = `${MEMBER_ADDON_PREFIX}-enterprise2022`,
    DOMAIN_ENTERPRISE = `${DOMAIN_ADDON_PREFIX}-enterprise2022`,
    MEMBER_VPN_PRO = `${MEMBER_ADDON_PREFIX}-vpnpro2023`,
    MEMBER_VPN_BUSINESS = `${MEMBER_ADDON_PREFIX}-vpnbiz2023`,
    IP_VPN_BUSINESS = `${IP_ADDON_PREFIX}-vpnbiz2023`,
    IP_BUNDLE_PRO = `${IP_ADDON_PREFIX}-bundlepro2022`,
    IP_BUNDLE_PRO_2024 = `${IP_ADDON_PREFIX}-bundlepro2024`,
    MEMBER_PASS_PRO = `${MEMBER_ADDON_PREFIX}-passpro2024`,
    MEMBER_PASS_BUSINESS = `${MEMBER_ADDON_PREFIX}-passbiz2024`,
    MEMBER_SCRIBE_MAIL_BUSINESS = `${SCRIBE_ADDON_PREFIX}-mailbiz2024`,
    MEMBER_SCRIBE_MAIL_PRO = `${SCRIBE_ADDON_PREFIX}-mailpro2022`,
    MEMBER_SCRIBE_BUNDLE_PRO = `${SCRIBE_ADDON_PREFIX}-bundlepro2022`,
    MEMBER_SCRIBE_BUNDLE_PRO_2024 = `${SCRIBE_ADDON_PREFIX}-bundlepro2024`,
    LUMO_MAIL = `${LUMO_ADDON_PREFIX}-mail2022`,
    LUMO_DRIVE = `${LUMO_ADDON_PREFIX}-drive2022`,
    LUMO_PASS = `${LUMO_ADDON_PREFIX}-pass2023`,
    LUMO_VPN = `${LUMO_ADDON_PREFIX}-vpn2022`,
    LUMO_VPN2024 = `${LUMO_ADDON_PREFIX}-vpn2024`,
    LUMO_BUNDLE = `${LUMO_ADDON_PREFIX}-bundle2022`,
    LUMO_FAMILY = `${LUMO_ADDON_PREFIX}-family2022`,
    LUMO_DUO = `${LUMO_ADDON_PREFIX}-duo2024`,
    LUMO_MAIL_PRO = `${LUMO_ADDON_PREFIX}-mailpro2022`,
    LUMO_MAIL_BUSINESS = `${LUMO_ADDON_PREFIX}-mailbiz2024`,
    LUMO_DRIVE_PRO = `${LUMO_ADDON_PREFIX}-drivepro2022`,
    LUMO_DRIVE_BUSINESS = `${LUMO_ADDON_PREFIX}-drivebiz2024`,
    LUMO_BUNDLE_PRO = `${LUMO_ADDON_PREFIX}-bundlepro2022`,
    LUMO_BUNDLE_PRO_2024 = `${LUMO_ADDON_PREFIX}-bundlepro2024`,
    LUMO_VPN_PRO = `${LUMO_ADDON_PREFIX}-vpnpro2023`,
    LUMO_VPN_BUSINESS = `${LUMO_ADDON_PREFIX}-vpnbiz2023`,
    LUMO_PASS_PRO = `${LUMO_ADDON_PREFIX}-passpro2024`,
    LUMO_PASS_BUSINESS = `${LUMO_ADDON_PREFIX}-passbiz2024`,
}

export enum PLANS {
    FREE = 'free',
    DRIVE = 'drive2022',
    DRIVE_PRO = 'drivepro2022',
    DRIVE_BUSINESS = 'drivebiz2024',
    DRIVE_LITE = 'drivelite2024',
    PASS = 'pass2023',
    MAIL = 'mail2022',
    MAIL_PRO = 'mailpro2022',
    MAIL_BUSINESS = 'mailbiz2024',
    VPN = 'vpn2022',
    VPN2024 = 'vpn2024',
    WALLET = 'wallet2024',
    BUNDLE = 'bundle2022',
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
    [ADDON_NAMES.LUMO_PASS]: 'MaxLumo',
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
export const MAX_DOMAIN_PRO_ADDON = 99;
export const MAX_DOMAIN_PLUS_ADDON = 10;
export const MAX_ADDRESS_ADDON = 10;
export const MAX_LUMO_ADDON = 1;
export const MAX_MEMBER_LUMO_ADDON = 5000;
// VPN B2B limits
export const MAX_MEMBER_VPN_B2B_ADDON = 5000;
export const MAX_IPS_ADDON = 100;

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
    [ADDON_NAMES.LUMO_PASS]: MAX_LUMO_ADDON,
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
    [PLANS.DRIVE]: 'Drive Plus',
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

export const FREE_SUBSCRIPTION = {
    isFreeSubscription: true,
    Plans: undefined,
    Currency: undefined,
    CouponCode: undefined,
    Cycle: undefined,
    UpcomingSubscription: undefined,
};
