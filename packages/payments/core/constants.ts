import type { PaymentMethodFlow } from './interface';

export enum PAYMENT_TOKEN_STATUS {
    PENDING = 0,
    CHARGEABLE = 1,
    FAILED = 2,
    CONSUMED = 3,
    NOT_SUPPORTED = 4,
}

export enum PAYMENT_METHOD_TYPES {
    CHARGEBEE_BITCOIN = 'chargebee-bitcoin',
    CASH = 'cash',
    TOKEN = 'token',
    CHARGEBEE_CARD = 'chargebee-card',
    CHARGEBEE_PAYPAL = 'chargebee-paypal',
    CHARGEBEE_SEPA_DIRECT_DEBIT = 'sepa-direct-debit',
    APPLE_PAY = 'apple-pay',
    GOOGLE_PAY = 'google-pay',
}
export const signupFlows: readonly PaymentMethodFlow[] = Object.freeze([
    'signup',
    'signup-pass',
    'signup-pass-upgrade',
    'signup-wallet',
    'signup-vpn',
    'signup-v2',
    'signup-v2-upgrade',
    'reservation-donation',
]);
export enum Autopay {
    DISABLE = 0,
    ENABLE = 1,
}

export enum InvoiceType {
    Other = 0,
    Subscription = 1,
    Cancellation = 2,
    Credit = 3,
    Donation = 4,
    Chargeback = 5,
    Renewal = 6,
    Refund = 7,
    Modification = 8,
    Addition = 9,
    CurrencyConversion = 10,
    // Type 11 is an internal invoice type used for the migration. It's not supposed to be used by the frontend.
    Product = 12,
    Manual = 13,
}

export enum InvoiceState {
    Unpaid = 0,
    Paid = 1,
    Void = 2,
    Billed = 3,
    Writeoff = 4,
}

export enum InvoiceOwner {
    User = 0,
    Organization = 1,
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
    TEST_CREDIT = 14,
    PREPAYMENT = 15,
}

export enum ADDON_PREFIXES {
    MEMBER = '1member',
    DOMAIN = '1domain',
    IP = '1ip',
    SCRIBE = '1scribe',
    LUMO = '1lumo',
    MEET = '1meet',
}

export enum ADDON_NAMES {
    // drivepro2022
    MEMBER_DRIVE_PRO = `${ADDON_PREFIXES.MEMBER}-drivepro2022`,
    LUMO_DRIVE_PRO = `${ADDON_PREFIXES.LUMO}-drivepro2022`,
    MEET_DRIVE_PRO = `${ADDON_PREFIXES.MEET}-drivepro2022`,

    // drivebiz2024
    MEMBER_DRIVE_BUSINESS = `${ADDON_PREFIXES.MEMBER}-drivebiz2024`,
    LUMO_DRIVE_BUSINESS = `${ADDON_PREFIXES.LUMO}-drivebiz2024`,
    MEET_DRIVE_BUSINESS = `${ADDON_PREFIXES.MEET}-drivebiz2024`,

    // mailpro2022
    MEMBER_MAIL_PRO = `${ADDON_PREFIXES.MEMBER}-mailpro2022`,
    MEMBER_SCRIBE_MAIL_PRO = `${ADDON_PREFIXES.SCRIBE}-mailpro2022`,
    LUMO_MAIL_PRO = `${ADDON_PREFIXES.LUMO}-mailpro2022`,
    MEET_MAIL_PRO = `${ADDON_PREFIXES.MEET}-mailpro2022`,

    // mailbiz2024
    MEMBER_MAIL_BUSINESS = `${ADDON_PREFIXES.MEMBER}-mailbiz2024`,
    MEMBER_SCRIBE_MAIL_BUSINESS = `${ADDON_PREFIXES.SCRIBE}-mailbiz2024`,
    LUMO_MAIL_BUSINESS = `${ADDON_PREFIXES.LUMO}-mailbiz2024`,
    MEET_MAIL_BUSINESS = `${ADDON_PREFIXES.MEET}-mailbiz2024`,

    // bundlepro2022
    MEMBER_BUNDLE_PRO = `${ADDON_PREFIXES.MEMBER}-bundlepro2022`,
    DOMAIN_BUNDLE_PRO = `${ADDON_PREFIXES.DOMAIN}-bundlepro2022`,
    IP_BUNDLE_PRO = `${ADDON_PREFIXES.IP}-bundlepro2022`,
    MEMBER_SCRIBE_BUNDLE_PRO = `${ADDON_PREFIXES.SCRIBE}-bundlepro2022`,
    LUMO_BUNDLE_PRO = `${ADDON_PREFIXES.LUMO}-bundlepro2022`,
    MEET_BUNDLE_PRO = `${ADDON_PREFIXES.MEET}-bundlepro2022`,

    // bundlepro2024
    MEMBER_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.MEMBER}-bundlepro2024`,
    DOMAIN_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.DOMAIN}-bundlepro2024`,
    IP_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.IP}-bundlepro2024`,
    MEMBER_SCRIBE_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.SCRIBE}-bundlepro2024`,
    LUMO_BUNDLE_PRO_2024 = `${ADDON_PREFIXES.LUMO}-bundlepro2024`,

    // bundlebiz2025
    MEMBER_BUNDLE_BIZ_2025 = `${ADDON_PREFIXES.MEMBER}-bundlebiz2025`,
    DOMAIN_BUNDLE_BIZ_2025 = `${ADDON_PREFIXES.DOMAIN}-bundlebiz2025`,
    IP_BUNDLE_BIZ_2025 = `${ADDON_PREFIXES.IP}-bundlebiz2025`,

    // vpnpro2023
    MEMBER_VPN_PRO = `${ADDON_PREFIXES.MEMBER}-vpnpro2023`,
    LUMO_VPN_PRO = `${ADDON_PREFIXES.LUMO}-vpnpro2023`,
    MEET_VPN_PRO = `${ADDON_PREFIXES.MEET}-vpnpro2023`,

    // vpnbiz2023
    MEMBER_VPN_BUSINESS = `${ADDON_PREFIXES.MEMBER}-vpnbiz2023`,
    IP_VPN_BUSINESS = `${ADDON_PREFIXES.IP}-vpnbiz2023`,
    LUMO_VPN_BUSINESS = `${ADDON_PREFIXES.LUMO}-vpnbiz2023`,
    MEET_VPN_BUSINESS = `${ADDON_PREFIXES.MEET}-vpnbiz2023`,
    DOMAIN_VPN_BUSINESS = `${ADDON_PREFIXES.DOMAIN}-vpnbiz2023`,

    // passpro2024
    MEMBER_PASS_PRO = `${ADDON_PREFIXES.MEMBER}-passpro2024`,
    LUMO_PASS_PRO = `${ADDON_PREFIXES.LUMO}-passpro2024`,
    MEET_PASS_PRO = `${ADDON_PREFIXES.MEET}-passpro2024`,

    // passbiz2024
    MEMBER_PASS_BUSINESS = `${ADDON_PREFIXES.MEMBER}-passbiz2024`,
    LUMO_PASS_BUSINESS = `${ADDON_PREFIXES.LUMO}-passbiz2024`,
    MEET_PASS_BUSINESS = `${ADDON_PREFIXES.MEET}-passbiz2024`,

    // lumobiz2025
    MEMBER_LUMO_BUSINESS = `${ADDON_PREFIXES.MEMBER}-lumobiz2025`,
    MEET_LUMO_BUSINESS = `${ADDON_PREFIXES.MEET}-lumobiz2025`,

    // meetbiz2025
    MEMBER_MEET_BUSINESS = `${ADDON_PREFIXES.MEMBER}-meetbiz2025`,
    LUMO_MEET_BUSINESS = `${ADDON_PREFIXES.LUMO}-meetbiz2025`,

    // meet2026
    MEMBER_MEET = `${ADDON_PREFIXES.MEMBER}-meet2026`,
    LUMO_MEET = `${ADDON_PREFIXES.LUMO}-meet2026`,

    // vpnpassbiz2025
    MEMBER_VPN_PASS_BUNDLE_BUSINESS = `${ADDON_PREFIXES.MEMBER}-vpnpassbiz2025`,
    LUMO_VPN_PASS_BUNDLE_BUSINESS = `${ADDON_PREFIXES.LUMO}-vpnpassbiz2025`,
    IP_VPN_PASS_BUNDLE_BUSINESS = `${ADDON_PREFIXES.IP}-vpnpassbiz2025`,
    MEET_VPN_PASS_BUNDLE_BUSINESS = `${ADDON_PREFIXES.MEET}-vpnpassbiz2025`,

    // B2C Lumo addons
    LUMO_MAIL = `${ADDON_PREFIXES.LUMO}-mail2022`,
    LUMO_DRIVE = `${ADDON_PREFIXES.LUMO}-drive2022`,
    LUMO_DRIVE_1TB = `${ADDON_PREFIXES.LUMO}-drive1tb2025`,
    LUMO_PASS = `${ADDON_PREFIXES.LUMO}-pass2023`,
    LUMO_PASS_FAMILY = `${ADDON_PREFIXES.LUMO}-passfamily2024`,
    LUMO_VPN2024 = `${ADDON_PREFIXES.LUMO}-vpn2024`,
    LUMO_BUNDLE = `${ADDON_PREFIXES.LUMO}-bundle2022`,
    LUMO_FAMILY = `${ADDON_PREFIXES.LUMO}-family2022`,
    LUMO_DUO = `${ADDON_PREFIXES.LUMO}-duo2024`,

    // B2C Meet addons
    MEET_LUMO = `${ADDON_PREFIXES.MEET}-lumo2024`,
    MEET_MAIL = `${ADDON_PREFIXES.MEET}-mail2022`,
    MEET_DRIVE = `${ADDON_PREFIXES.MEET}-drive2022`,
    MEET_DRIVE_1TB = `${ADDON_PREFIXES.MEET}-drive1tb2025`,
    MEET_PASS = `${ADDON_PREFIXES.MEET}-pass2023`,
    MEET_PASS_FAMILY = `${ADDON_PREFIXES.MEET}-passfamily2024`,
    MEET_VPN2024 = `${ADDON_PREFIXES.MEET}-vpn2024`,
    MEET_BUNDLE = `${ADDON_PREFIXES.MEET}-bundle2022`,
    MEET_FAMILY = `${ADDON_PREFIXES.MEET}-family2022`,
    MEET_DUO = `${ADDON_PREFIXES.MEET}-duo2024`,
    MEET_VPN_PASS_BUNDLE = `${ADDON_PREFIXES.MEET}-vpnpass2023`,
}

// Max quantity for all addons
export const MAX_MEMBER_ADDON = 5000;
export const MAX_DOMAIN_PRO_ADDON = 200;
export const MAX_LUMO_ADDON = 1;
export const MAX_MEMBER_LUMO_ADDON = 5000;
export const MAX_MEET_ADDON = 1;
export const MAX_MEMBER_MEET_ADDON = 5000;
// VPN B2B limits
export const MAX_IPS_ADDON = 100;

// B2B Trial constants
export const TRIAL_DURATION_DAYS = 14; // ideally we would use the BE as the source of truth, but we hardcoded it here and there

// B2B Trial limits, currently only used for B2B Trials
// Hardcoded FE side. Protections will (as of 2025-06-18) be added on the BE side too.
export const TRIAL_MAX_USERS = 10;
export const TRIAL_MAX_SCRIBE_SEATS = 10;
export const TRIAL_MAX_LUMO_SEATS = 10;
export const TRIAL_MAX_MEET_SEATS = 10;
export const TRIAL_MAX_DEDICATED_IPS = 1;
export const TRIAL_MAX_EXTRA_CUSTOM_DOMAINS = 0;

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
    /**
     * @deprecated.
     * Unless you know exactly what you are doing, don't use this plan. This plan is deprecated and will be removed in the future.
     */
    MAIL_BUSINESS = 'mailbiz2024',
    /**
     * @deprecated.
     * Unless you know exactly what you are doing, don't use this plan. The new VPN plan is VPN2024.
     */
    VPN = 'vpn2022',
    VPN2024 = 'vpn2024',
    BUNDLE = 'bundle2022',
    /**
     * @deprecated.
     * Unless you know exactly what you are doing, don't use this plan. The new bundle pro plan is BUNDLE_PRO_2024.
     */
    BUNDLE_PRO = 'bundlepro2022',
    BUNDLE_PRO_2024 = 'bundlepro2024',
    BUNDLE_BIZ_2025 = 'bundlebiz2025',
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
    LUMO_BUSINESS = 'lumobiz2025',
    MEET = 'meet2026',
    MEET_BUSINESS = 'meetbiz2025',
    VPN_PASS_BUNDLE_BUSINESS = 'vpnpassbiz2025',
}

export const PLAN_NAMES: Record<PLANS, string> = {
    [PLANS.FREE]: 'Free',
    [PLANS.VPN]: 'VPN Plus',
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
    [PLANS.LUMO_BUSINESS]: 'Lumo Professional',
    [PLANS.LUMO]: 'Lumo Plus',
    [PLANS.BUNDLE]: 'Proton Unlimited',
    [PLANS.BUNDLE_PRO]: 'Proton Business Suite',
    [PLANS.BUNDLE_PRO_2024]: 'Workspace Standard',
    [PLANS.BUNDLE_BIZ_2025]: 'Workspace Premium',
    [PLANS.FAMILY]: 'Proton Family',
    [PLANS.DUO]: 'Proton Duo',
    [PLANS.VISIONARY]: 'Visionary',
    [PLANS.VPN_PRO]: 'VPN Essentials',
    [PLANS.VPN_BUSINESS]: 'VPN Professional',
    [PLANS.VPN_PASS_BUNDLE]: 'VPN and Pass bundle',
    [PLANS.PASS_PRO]: 'Pass Essentials',
    [PLANS.PASS_BUSINESS]: 'Pass Professional',
    [PLANS.PASS_FAMILY]: 'Pass Family',
    [PLANS.PASS_LIFETIME]: 'Pass + SimpleLogin Lifetime',
    [PLANS.MEET]: 'Meet Professional',
    [PLANS.MEET_BUSINESS]: 'Meet Professional',
    [PLANS.VPN_PASS_BUNDLE_BUSINESS]: 'VPN and Pass Professional',
};

export const ENTERPRISE_PLAN_TITLE = 'Enterprise';
export const LIFETIME_PLAN_TITLE = 'Lifetime';

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
    JPY = '¥',
    KRW = '₩',
    PLN = 'zł',
    SGD = 'SGD',
    HKD = 'HK$',
}

export const CURRENCIES = Object.keys(CurrencySymbols) as readonly (keyof typeof CurrencySymbols)[];

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

    // BF 2025
    BLACK_FRIDAY_2025 = 'BF25PROMO',
    BLACK_FRIDAY_2025_MONTH = 'BF25PROMO1M',
    BLACK_FRIDAY_2025_BUNDLE = 'BF25BUNDLEPROMO',
    BLACK_FRIDAY_2025_LIGHTNING = 'BF25LIGHTNING',
    BLACK_FRIDAY_2025_LUMOADDON = 'BF25LUMOADDON',
    BLACK_FRIDAY_2025_LUMOADDON_OMNI = 'BF25LUMOADDONPROMO',
    BLACK_FRIDAY_2025_DEALPD = 'BF25DEALPD',
    BLACK_FRIDAY_2025_DEALVM = 'BF25DEALVM',
    BLACK_FRIDAY_2025_TWOYEAR = 'BF25PROMO24',
    BLACK_FRIDAY_2025_CS = 'BF25PROMOCS',
    BLACK_FRIDAY_2025_TWOYEAR_CS = 'BF25PROMO24CS',
    BLACK_FRIDAY_2025_MONTH_CS = 'BF25PROMO1MCS',
    BLACK_FRIDAY_2025_BUNDLE_CS = 'BF25BUNDLEPROMOCS',
    BLACK_FRIDAY_2025_LUMOADDON_CS = 'BF25LUMOADDONCS',
    BLACK_FRIDAY_2025_LIGHTNING_CS = 'BF25LIGHTNINGCS',
    BLACK_FRIDAY_2025_LUMOADDON_PROMO_CS = 'BF25LUMOADDONPROMOCS',

    // Monthy user nudge
    ANNUALOFFER25 = 'ANNUALOFFER25',

    // Renew and save cancellation offer
    RENEWANDSAVE1M26 = 'RENEWANDSAVE1M26',
    RENEWANDSAVE12M26 = 'RENEWANDSAVE12M26',

    LIFETIME = 'LIFETIME',
    VPN_VIVALDI = 'VIVALDIVPN',
    MAILPLUSINTRO = 'MAILPLUSINTRO',
    TRYDRIVEPLUS2024 = 'DRIVEPLUSINTRO2024',
    PASSPLUSINTRO2024 = 'PASSPLUSINTRO2024',
    VPN_INTRO_2025 = 'VPNINTROPRICE2025',
    VPN_PLUS_FREE_2024 = 'VPNPLUSFREE2024',
    TRYVPNPLUS2024 = 'TRYVPNPLUS2024',
    VPNMATCHDAYDEALS = 'VPNMATCHDAYDEALS',

    // VPN + Pass bundle coupons (vpnpass2023)
    TECHRADARVPNPASS = 'TECHRADARVPNPASS',
    CNETVPNPASS = 'CNETVPNPASS',
    COMPARITECHVPNPASS = 'COMPARITECHVPNPASS',
    PCMAGVPNPASS = 'PCMAGVPNPASS',
    VPNPASSINTRO2026 = 'VPNPASSINTRO2026',

    /** 1$ offer */
    TRYMAILPLUS0724 = 'TRYMAILPLUS0724',
    /** PassFamily Promo */
    PASSEARLYSUPPORTER = 'PASSEARLYSUPPORTER',
    PASSFAMILYLAUNCH = 'PASSFAMILYLAUNCH',

    // CS Coupons Spring Sale
    MAR26SALECS = 'MAR26SALECS',
    MAR26BUNDLESALECS = 'MAR26BUNDLESALECS',
    MAR26OFFERCS = 'MAR26OFFERCS',

    // Summer Sale 2026
    JUNE26SALE = 'JUNE26SALE',
    JUNE26BUNDLESALE = 'JUNE26BUNDLESALE',

    // World cup retention offer
    VPNSAVEOFFER = 'VPNSAVEOFFER',
}

export const VPN_PASS_PROMOTION_COUPONS = [
    COUPON_CODES.TECHRADARVPNPASS,
    COUPON_CODES.CNETVPNPASS,
    COUPON_CODES.COMPARITECHVPNPASS,
    COUPON_CODES.PCMAGVPNPASS,
];
