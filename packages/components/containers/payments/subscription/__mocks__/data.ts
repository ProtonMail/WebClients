import { ORGANIZATION_STATE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import type {
    OrganizationWithSettings,
    PendingInvitation,
    Subscription,
    User,
    UserSettings,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';

import type { UpsellCta } from '../helpers';

export const mailPlusUpsell = {
    plan: PLANS.MAIL,
    planKey: PLANS.MAIL,
    title: 'Mail Plus',
    description: 'Secure email with advanced features for your everyday communications.',
    upsellRefLink: 'upsell_mail-button-mailplus-dashboard_settings',
    features: [
        {
            text: ['', '15 GB', ' storage'],
            tooltip: 'Storage space is shared across Proton Mail, Proton Calendar, Proton Drive, and Proton Pass',
            included: true,
            highlight: false,
            icon: 'storage',
        },
        {
            text: '10 email addresses/aliases',
            tooltip:
                'Create multiple email addresses for your online identities, e.g., JohnShopper@proton.me for shopping accounts, JohnNews@proton.me for news subscription',
            included: true,
            icon: 'envelope',
        },
        {
            text: '1 custom email domain',
            tooltip: 'Use your own custom email domain addresses, e.g., you@yourname.com',
            included: true,
            icon: 'globe',
        },
        {
            text: '25 calendars',
            tooltip: 'Create up to 25 calendars or add calendars from friends, family, colleagues, and organizations',
            included: true,
            icon: 'brand-proton-calendar',
        },
        {
            icon: 'brand-proton-vpn',
            text: '1 VPN connection',
            included: true,
        },
        {
            text: 'Proton Pass with 10 hide-my-email aliases',
            icon: 'brand-proton-pass',
            included: true,
            hideInDowngrade: true,
        },
    ],
    otherCtas: [],
    price: {
        value: 349,
        currency: 'EUR',
    },
};

export const trialMailPlusUpsell = {
    ...mailPlusUpsell,
    title: 'Mail Plus Trial',
    otherCtas: [
        {
            label: 'Explore all Proton plans',
            action: () => {},
            color: 'norm',
            shape: 'ghost',
        },
    ] as UpsellCta[],
    isTrialEnding: true,
    hasVPN: false,
    hasPaidMail: false,
};

export const unlimitedUpsell = {
    plan: PLANS.BUNDLE,
    planKey: PLANS.BUNDLE,
    title: 'Proton Unlimited',
    description: 'Comprehensive privacy and security with all Proton services combined.',
    upsellRefLink: 'upsell_mail-button-unlimited-dashboard_settings',
    features: [
        {
            text: ['', '500 GB', ' storage'],
            tooltip: 'Storage space is shared across Proton Mail, Proton Calendar, Proton Drive, and Proton Pass',
            included: true,
            highlight: false,
            icon: 'storage',
        },
        {
            text: '15 email addresses/aliases',
            tooltip:
                'Create multiple email addresses for your online identities, e.g., JohnShopper@proton.me for shopping accounts, JohnNews@proton.me for news subscription',
            included: true,
            icon: 'envelope',
        },
        {
            text: '3 custom email domains',
            tooltip: 'Use your own custom email domain addresses, e.g., you@yourname.com',
            included: true,
            icon: 'globe',
        },
        {
            icon: 'brand-proton-calendar',
            included: true,
            text: '25 calendars',
            tooltip: 'Create up to 25 calendars or add calendars from friends, family, colleagues, and organizations',
        },
        {
            icon: 'clock-rotate-left',
            included: true,
            text: '10-year file version history',
        },
        {
            icon: 'brand-proton-vpn',
            text: '10 high-speed VPN connections',
            included: true,
        },
        {
            text: 'Proton Pass with unlimited hide-my-email aliases',
            icon: 'brand-proton-pass',
            included: true,
            hideInDowngrade: true,
        },
        {
            text: 'Proton Sentinel program',
            tooltip: `Provides the highest level of account security protection and specialist support`,
            included: true,
            icon: 'shield',
        },
    ],
    otherCtas: [],
    price: {
        value: 799,
        currency: 'EUR',
    },
};

export const familyUpsell = {
    plan: PLANS.FAMILY,
    planKey: PLANS.FAMILY,
    title: 'Proton Family',
    description: 'Protect your family’s privacy with all Proton services combined.',
    upsellRefLink: 'upsell_mail-button-family-dashboard_settings',
    features: [
        {
            text: ['', '3 TB', ' storage'],
            tooltip:
                'Storage space is shared between users across Proton Mail, Proton Calendar, Proton Drive, and Proton Pass',
            included: true,
            highlight: false,
            icon: 'storage',
        },
        {
            text: 'Up to 6 users',
            icon: 'users',
            included: true,
        },
        {
            text: '90 email addresses/aliases',
            tooltip:
                'Create up to 90 email addresses/aliases that you can assign to family members. Use them for online identities, e.g., JohnShopper@proton.me for shopping accounts.',
            included: true,
            icon: 'envelope',
        },
        {
            text: '3 custom email domains',
            tooltip: 'Use your own custom email domain addresses, e.g., you@yourname.com',
            included: true,
            icon: 'globe',
        },
        {
            text: '25 calendars',
            tooltip: 'Create up to 25 calendars or add calendars from friends, family, colleagues, and organizations',
            included: true,
            icon: 'brand-proton-calendar',
        },
        {
            icon: 'brand-proton-vpn',
            text: '10 high-speed VPN connections',
            included: true,
        },
        {
            text: 'Proton Pass with unlimited hide-my-email aliases',
            icon: 'brand-proton-pass',
            included: true,
            hideInDowngrade: true,
        },
        {
            text: 'Proton Sentinel program',
            tooltip: `Provides the highest level of account security protection and specialist support`,
            included: true,
            icon: 'shield',
        },
    ],
    otherCtas: [],
    price: { value: 1999, currency: 'EUR' },
};

export const duoUpsell = {
    plan: PLANS.DUO,
    planKey: PLANS.DUO,
    title: 'Proton Duo',
    description: 'Unlimited privacy and more storage for up to 2 people.',
    upsellRefLink: 'upsell_mail-button-duo-dashboard_settings',
    features: [
        {
            text: ['', '1 TB', ' storage'],
            tooltip: 'Storage space is shared across Proton Mail, Proton Calendar, Proton Drive, and Proton Pass',
            included: true,
            highlight: false,
            icon: 'storage',
        },
        {
            text: 'Up to 2 users',
            icon: 'users',
            included: true,
        },
        {
            text: '30 email addresses/aliases',
            tooltip:
                'Create up to 30 email addresses/aliases that you can assign to family members. Use them for online identities, e.g., JohnShopper@proton.me for shopping accounts.',
            included: true,
            icon: 'envelope',
        },
        {
            text: '3 custom email domains',
            tooltip: 'Use your own custom email domain addresses, e.g., you@yourname.com',
            included: true,
            icon: 'globe',
        },
        {
            text: '25 calendars',
            tooltip: 'Create up to 25 calendars or add calendars from friends, family, colleagues, and organizations',
            included: true,
            icon: 'brand-proton-calendar',
        },
        {
            icon: 'brand-proton-vpn',
            text: '10 high-speed VPN connections',
            included: true,
        },
        {
            text: 'Proton Pass with unlimited hide-my-email aliases',
            icon: 'brand-proton-pass',
            included: true,
            hideInDowngrade: true,
        },
        {
            text: 'Proton Sentinel program',
            tooltip: `Provides the highest level of account security protection and specialist support`,
            included: true,
            icon: 'shield',
        },
    ],
    otherCtas: [],
    price: { value: 1199, currency: 'EUR' },
};

export const businessUpsell = {
    plan: PLANS.BUNDLE_PRO,
    planKey: PLANS.BUNDLE_PRO,
    title: 'Business',
    description: 'All Proton business apps and premium features to protect your entire business.',
    upsellRefLink: 'upsell_mail-button-business-dashboard_settings',
    features: [
        {
            icon: 'storage',
            text: 'Boost your storage space to 500 GB per user',
        },
        {
            icon: 'envelope',
            text: '5 email addresses per user',
        },
        {
            icon: 'globe',
            text: 'Cover more ground with support for 10 custom email domains',
        },
        {
            icon: 'brand-proton-vpn',
            text: '10 high-speed VPN connections per user',
        },
        {
            icon: 'checkmark-circle',
            text: 'Access advanced VPN features',
        },
    ],
    otherCtas: [],
    price: {
        value: 999,
        currency: 'EUR',
    },
};

export const mailProfessionalUpsell = {
    plan: PLANS.MAIL_BUSINESS,
    planKey: PLANS.MAIL_BUSINESS,
    title: 'Mail Professional',
    description: 'Enhanced security and premium features for teams.',
    upsellRefLink: 'upsell_mail-button-mailpro-dashboard_settings',
    features: [
        {
            icon: 'storage',
            text: 'Boost your storage space to 50 GB per user',
        },
        {
            icon: 'envelope',
            text: '15 email addresses per user',
        },
        {
            icon: 'globe',
            text: 'Support for 10 custom email domains',
        },
        {
            icon: 'brand-proton-vpn',
            text: '1 VPN connection',
        },
        {
            icon: 'image',
            text: 'Custom workspace branding',
        },
        {
            icon: 'shield',
            text: 'Proton Sentinel program',
        },
    ],
    otherCtas: [],
    price: {
        value: 999,
        currency: 'EUR',
    },
};

export const drivePlusUpsell = {
    plan: PLANS.DRIVE,
    planKey: PLANS.DRIVE,
    title: 'Drive Plus',
    description: 'Secure cloud storage that lets you store, sync, and share files easily and securely.',
    upsellRefLink: 'upsell_drive-button-drive-dashboard_settings',
    features: [
        {
            text: ['', '200 GB', ' storage'],
            tooltip: 'Storage space is shared across Proton Mail, Proton Calendar, Proton Drive, and Proton Pass',
            included: true,
            highlight: false,
            icon: 'storage',
        },
        {
            text: 'Online document editor',
            included: true,
            icon: 'pencil',
        },
        {
            text: '10-year file version history',
            included: true,
            icon: 'clock-rotate-left',
        },
        {
            text: 'All basic Proton services (Mail, VPN, Pass)',
            included: true,
            icon: 'brand-proton',
        },
    ],
    otherCtas: [],
    price: {
        value: 349,
        currency: 'EUR',
    },
};

export const passPlusUpsell = {
    plan: PLANS.PASS,
    planKey: PLANS.PASS,
    title: 'Pass Plus',
    description: 'For next-level password management and identity protection.',
    upsellRefLink: 'upsell_pass-button-pass-dashboard_settings',
    features: [
        {
            text: 'Unlimited logins, notes and credit cards',
            icon: 'note',
            included: true,
            hideInDowngrade: true,
        },
        {
            text: 'Unlimited devices',
            icon: 'mobile',
            included: true,
            hideInDowngrade: true,
        },
        {
            text: 'Unlimited hide-my-email aliases',
            tooltip:
                'Protect your real email address from being disclosed or leaked with aliases (a randomly-generated email address that forwards emails to your main inbox).',
            included: true,
            icon: 'eye-slash',
        },
        {
            text: '50 vaults',
            tooltip: 'Like a folder, a vault is a convenient way to organize your items',
            included: true,
            icon: 'vault',
        },
        {
            hideInDowngrade: true,
            icon: 'arrow-up-from-square',
            included: true,
            text: 'Vault sharing (up to 10 people)',
        },
        {
            text: 'Integrated 2FA authenticator',
            included: true,
            icon: 'key',
        },
        {
            text: 'Custom fields',
            included: true,
            icon: 'pen-square',
        },
        {
            icon: 'shield',
            included: true,
            text: 'Proton Sentinel program',
            tooltip: 'Provides the highest level of account security protection and specialist support',
        },
        {
            text: 'Priority support',
            included: true,
            icon: 'life-ring',
        },
    ],
    otherCtas: [],
    price: {
        value: 299,
        currency: 'EUR',
    },
};

export const vpnBusinessUpsell = {
    plan: PLANS.VPN_BUSINESS,
    planKey: PLANS.VPN_BUSINESS,
    title: 'VPN Professional', // the plan got renamed during the Proton Business Suite launch
    description: 'Advanced network security and access management with dedicated secure Gateways',
    otherCtas: [],
    price: {
        value: 5397,
        currency: 'EUR',
    },
};

export const vpnEnterpriseUpsell = {
    planKey: 'VPN_ENTERPRISE',
    title: 'VPN Enterprise',
    description: 'Tailor-made solutions for larger organizations with specific security needs',
};

export const subscription = {
    Plans: [
        {
            Name: PLANS.MAIL,
            Type: PLAN_TYPES.PLAN,
        },
    ],
} as Subscription;

export const subscriptionBundle = {
    ID: 'PpErwjEKmPzaSJq7niHgapRGcJXdHg9xiDvVZd98OF1hXojWlmbuKMpxSZihUh-I9agIbYHw3bkZJ44KixWQNg==',
    InvoiceID: '8jJIlDHXg2jQYePRCBicfTKDbJwecy529KlYGdoqPGnAQ2ALW1RkH4dWFQ1vDIp9UryQ6ezSRiw0vEKmaTiX2g==',
    Cycle: 12,
    PeriodStart: 1685966060,
    PeriodEnd: 1717588460,
    CreateTime: 1685966060,
    CouponCode: null,
    Currency: 'EUR',
    Amount: 11988,
    Discount: 0,
    RenewAmount: 11988,
    Plans: [
        {
            ID: 'tHdKCeJlgD7mv_W13BqEZeelMiptPIK6r8arzZFcQcLvBLNiogdGOGVyYOldyhzcnSzCPkvkWj-VtyDwSjIncg==',
            Name: PLANS.BUNDLE,
            Type: PLAN_TYPES.PLAN,
            Title: 'Proton Unlimited',
            MaxDomains: 3,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 536870912000,
            MaxMembers: 1,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 15,
            Features: 1,
            State: 1,
            Cycle: 12,
            Currency: 'EUR',
            Amount: 11988,
            Quantity: 1,
        },
    ],
} as Subscription;

export const subscriptionBusiness = {
    Cycle: 12,
    Currency: 'EUR',
    Amount: 11988,
    Plans: [
        {
            Name: PLANS.MAIL_PRO,
            Type: PLAN_TYPES.PLAN,
            Title: 'Proton Pro',
            MaxDomains: 3,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 536870912000,
            MaxMembers: 1,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 15,
            Features: 1,
            State: 1,
            Cycle: 12,
            Currency: 'EUR',
            Amount: 11988,
        },
    ],
} as Subscription;

export const organization = {
    Name: 'test',
    UsedDomains: 1,
    MaxDomains: 3,
    UsedSpace: 987359925,
    MaxSpace: 1073741824,
    UsedAddresses: 7,
    MaxAddresses: 20,
    UsedMembers: 2,
    MaxMembers: 5,
    Settings: {},
    State: ORGANIZATION_STATE.ACTIVE,
} as OrganizationWithSettings;

export const vpnServersCount = {
    free: {
        servers: 192,
        countries: 3,
    },
    paid: {
        servers: 2950,
        countries: 65,
    },
} as VPNServersCountData;

export const user = {
    MaxSpace: 1073741824,
    MaxUpload: 26214400,
    UsedSpace: 977359925,
    isAdmin: true,
    isFree: false,
    isMember: false,
    isPaid: true,
    isPrivate: true,
    isSubUser: false,
    isDelinquent: false,
    hasNonDelinquentScope: true,
    hasPaidMail: true,
    hasPaidVpn: true,
    canPay: true,
} as unknown as User;

export const userSettings = {
    HighSecurity: {
        Eligible: false,
    },
} as unknown as UserSettings;

export const pendingInvite = {
    ID: 'ZhhRDNTAVfX9seV5rWSw_2_4rP23tplH2ajNld9iOJc49qiL_cafDdQvHIG3dHXpYsbcmPUKdZjz3Bb7S81Uiw==',
    InviterEmail: 'testinvites@protontest.com',
    OrganizationName: 'Test Org',
} as PendingInvitation;

export const calendars = [
    {
        ID: '2lBg7c-llitncK-rleyMCEBnuVHJPd9i5HrdMMZP7OMfioUGTx4Tqx2oGSQjD5vMg8639__wmj9vLZnk2c45sw==',
    },
    {
        ID: '-5TcZlOQHrNakdQHZYduP2M4jyh3Q7j4YwSW-8ib8W3-dUSpdCQglfmOudMGY10c8Kclm--smRSqjz3CzLYLFw==',
    },
    {
        ID: 'Msdl_ju-F7w3nO6dm2Y3GfiCFJQU3jLVD_0Dk4qPyrOYVgeyuwjFY9_DPAOZler_XwNcv27qxg70PkhvIqqGhw==',
    },
];

export const addresses = [
    {
        ID: 'A17MnOJQ4w_BkRoCb9o9RISXCRfIqCb3NaGUGeM9jyei4Zj2WtGVlyBzZqGhc_oSPv8qund-nP5ZXc-E9oYNAw==',
        Email: 'testas1@protonmail.com',
        Status: 1,
        Receive: 1,
        Send: 1,
    },
    {
        ID: 'IRSyGs2rcuAUUUv_Rzur_H6PFPUoEpc4iB8pa4BPvuKAJap2BDqD8Rra0Jn1_iY9gLGV1cc0YjjZW34DPBTNaQ==',
        Email: 'testas1@pm.me',
        Status: 1,
        Receive: 1,
        Send: 1,
    },
];
