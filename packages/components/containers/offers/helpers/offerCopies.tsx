import type { ReactElement } from 'react';

import { c, msgid } from 'ttag';

import { type IconName } from '@proton/components/components/icon/Icon';
import { getDesktopAppText, getOwnDomainText } from '@proton/components/containers/payments/features/mail';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    CALENDAR_SHORT_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { getPremiumPasswordManagerText } from '@proton/shared/lib/helpers/checkout';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getPremium } from '@proton/shared/lib/helpers/premium';

import { getProtonPassFeatureTooltipText } from '../../payments/features/pass';

export const getMonthFreeText = (n: number) => {
    return c('specialoffer: Deal').ngettext(msgid`${n} month FREE`, `${n} months FREE`, n);
};

export const getMonthsFree = (cycle: CYCLE) => {
    if (cycle === CYCLE.THIRTY) {
        return 6;
    }
    if (cycle === CYCLE.FIFTEEN) {
        return 3;
    }
    return 0;
};

const getStorageSizeFeature = (storageSize: string, vpn?: boolean) => {
    return {
        name: c('BF2024: Deal details').t`${storageSize} storage`,
        tooltip: vpn ? undefined : c('BF2024: Tooltip').t`Storage space is shared across all ${BRAND_NAME} services.`,
    };
};

export const getUnlimitedFeatures = () => {
    return [
        getStorageSizeFeature(humanSize({ bytes: 500 * 1024 ** 3, fraction: 0 })),
        {
            name: c('specialoffer: Deal details').t`All paid Mail and Calendar features`,
            tooltip: c('specialoffer: Tooltip')
                .t`Includes support for 3 custom email domains, 15 email addresses, unlimited hide-my-email aliases, calendar sharing, and more.`,
        },
        {
            name: c('specialoffer: Deal details').t`High speed VPN`,
            tooltip: c('specialoffer: Tooltip')
                .t`Access blocked content and browse privately. Includes 1700 servers in 60+ countries, highest VPN speed, 10 VPN connections, worldwide streaming services, malware and ad-blocker, and more.`,
        },
        {
            name: c('specialoffer: Deal details').t`Secure cloud storage`,
            tooltip: c('specialoffer: Tooltip')
                .t`Secure your files with encrypted cloud storage. Includes automatic sync, encrypted file sharing, and more.`,
        },
    ];
};

export const getMailDealFeatures = () => {
    return [
        getStorageSizeFeature(humanSize({ bytes: 15 * 1024 ** 3, fraction: 0 })),
        {
            name: getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME),
            tooltip: c('summer2023: Tooltip')
                .t`Includes support for 1 custom email domain, 10 email addresses, 10 hide-my-email aliases, calendar sharing, and more.`,
        },
    ];
};

export const getUnlimitedDealFeatures = () => {
    return [
        getStorageSizeFeature(humanSize({ bytes: 500 * 1024 ** 3, fraction: 0 })),
        {
            name: getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME),
            tooltip: c('specialoffer: Tooltip')
                .t`Includes support for 3 custom email domains, 15 email addresses, unlimited hide-my-email aliases, calendar sharing, and more.`,
        },
        {
            name: getPremium(DRIVE_SHORT_APP_NAME),
            tooltip: c('summer2023: Tooltip')
                .t`Secure your files with encrypted cloud storage. Includes version history, encrypted file sharing, and more.`,
        },
        {
            name: getPremium(VPN_SHORT_APP_NAME),
            tooltip: c('summer2023: Tooltip')
                .t`Includes 2950+ servers in 65+ countries, connect up to 10 devices, access worldwide streaming services, malware and ad-blocker, and more.`,
        },
        {
            name: getPremiumPasswordManagerText(),
            tooltip: c('summer2023: Tooltip')
                .t`Create secure login details on all your devices. Includes unlimited aliases, 20 vaults, integrated 2FA, credit card auto-fill and more.`,
        },
    ];
};

const getPremiumVPNFeature = () => ({
    name: PLAN_NAMES[PLANS.VPN],
    tooltip: c('BF2024: Tooltip')
        .t`Access blocked content and browse privately. Includes 8,500+ servers across 110+ countries, 10 devices, high-speed streaming, ad-blocker and malware protection, VPN Accelerator and more.`,
});

const getPremiumPasswordManagerFeature = () => ({
    name: PLAN_NAMES[PLANS.PASS],
    tooltip: c('BF2024: Tooltip')
        .t`Secure logins on all your devices. Includes unlimited hide-my-email aliases, sharing, integrated 2FA, ${DARK_WEB_MONITORING_NAME} and more.`,
});

const getPremiumDriveFeature = () => ({
    name: PLAN_NAMES[PLANS.DRIVE],
    tooltip: c('BF2024: Tooltip')
        .t`Secure your files with encrypted cloud storage. Includes online document editor, photo backup, version history, encrypted file sharing, and more.`,
});

const getPremiumInboxFeature = (domains?: number, addresses?: number, scribe?: boolean) => {
    const name = c('BF2024: Deal details').t`${MAIL_SHORT_APP_NAME} Plus and ${CALENDAR_SHORT_APP_NAME}`;

    if (addresses) {
        if (domains === 1) {
            return {
                name,
                tooltip: c('bf2023: Tooltip')
                    .t`Includes support for 1 custom email domain, 10 email addresses, 10 hide-my-email aliases, calendar sharing, and more.`,
            };
        }

        if (scribe === false) {
            return {
                name,
                tooltip: c('BF2024: Tooltip').ngettext(
                    msgid`Secure your emails and schedule with end-to-end encryption. Includes ${addresses} email address, support for custom email domains, unlimited hide-my-email aliases and more.`,
                    `Secure your emails and schedule with end-to-end encryption. Includes ${addresses} email addresses, support for custom email domains, unlimited hide-my-email aliases and more.`,
                    addresses
                ),
            };
        }

        return {
            name,
            tooltip: c('BF2024: Tooltip').ngettext(
                msgid`Secure your emails and schedule with end-to-end encryption. Includes ${addresses} email address, support for custom email domains, ${BRAND_NAME} Scribe writing assistant, unlimited hide-my-email aliases and more.`,
                `Secure your emails and schedule with end-to-end encryption. Includes ${addresses} email addresses, support for custom email domains, ${BRAND_NAME} Scribe writing assistant, unlimited hide-my-email aliases and more.`,
                addresses
            ),
        };
    }

    if (scribe === false) {
        return {
            name,
            tooltip: c('BF2024: Tooltip')
                .t`Secure your emails and schedule with end-to-end encryption. Includes 15 email addresses, support for custom email domains, unlimited hide-my-email aliases and more.`,
        };
    }

    return {
        name,
        tooltip: c('BF2024: Tooltip')
            .t`Secure your emails and schedule with end-to-end encryption. Includes 15 email addresses, support for custom email domains, ${BRAND_NAME} Scribe writing assistant, unlimited hide-my-email aliases and more.`,
    };
};

export const getMailPlusInboxFeatures = () => {
    return [
        getStorageSizeFeature(humanSize({ bytes: 15 * 1024 ** 3, fraction: 0 })),
        {
            name: c('specialoffer: Deal details').t`1 user`,
        },
        getPremiumInboxFeature(1, 10),
    ];
};

export const getMailPlus2024InboxFeatures = (): { name: string }[] => {
    return [
        { ...getStorageSizeFeature(humanSize({ bytes: 15 * 1024 ** 3, fraction: 0 }), true) }, // true remove the tooltip
        { name: c('BF2024: Deal details').t`10 email addresses` },
        { name: c('BF2024: Deal details').t`Unlimited folders, labels and filters` },
        { name: getOwnDomainText() },
        { name: getDesktopAppText() },
        { name: DARK_WEB_MONITORING_NAME },
    ];
};

export const getPassPlusFeatures = () => {
    return [
        { name: c('BF2024: Deal details').t`1 user account` },
        { name: c('BF2024: Deal details').t`Unlimited logins, notes, credit cards` },
        { name: c('BF2024: Deal details').t`Secure vault and link sharing` },
        { name: c('BF2024: Deal details').t`Unlimited hide-my-email aliases` },
        { name: c('BF2024: Deal details').t`Integrated 2FA authenticator` },
        { name: c('BF2024: Deal details').t`Password health alerts` },
        { name: DARK_WEB_MONITORING_NAME },
        { name: c('BF2024: Deal details').t`Advanced account protection` },
    ];
};

export const getLifetimePassFeatures = () => {
    return [
        { name: c('BF2024: Deal details').t`1 user account` },
        {
            name: c('BF2024: Deal details').t`One-time payment, lifetime deal`,
            tooltip: getProtonPassFeatureTooltipText(),
        },
        { name: c('BF2024: Deal details').t`Unlimited logins, notes, credit cards` },
        { name: c('BF2024: Deal details').t`Secure vault and link sharing` },
        { name: c('BF2024: Deal details').t`Unlimited hide-my-email aliases` },
        { name: c('BF2024: Deal details').t`Integrated 2FA authenticator` },
        { name: c('BF2024: Deal details').t`Password health alerts` },
        { name: DARK_WEB_MONITORING_NAME },
        { name: c('BF2024: Deal details').t`Advanced account protection` },
    ];
};

export const getFamilyPassFeatures = () => {
    return [
        { name: c('BF2024: Deal details').t`6 user accounts` },
        { name: c('BF2024: Deal details').t`Unlimited logins, notes, credit cards` },
        { name: c('BF2024: Deal details').t`Secure vault and link sharing` },
        { name: c('BF2024: Deal details').t`Unlimited hide-my-email aliases` },
        { name: c('BF2024: Deal details').t`Integrated 2FA authenticator` },
        { name: c('BF2024: Deal details').t`Password health alerts` },
        { name: DARK_WEB_MONITORING_NAME },
        { name: c('BF2024: Deal details').t`Advanced account protection` },
        { name: c('BF2024: Deal details').t`Admin panel to manage your family` },
        { name: c('BF2024: Deal details').t`Easily add or remove users` },
    ];
};

export const getTryDrivePlus2024Features = (): { name: string; icon: IconName }[] => {
    const TWO_HUNDREDS_GIGABYTES = 200 * 1024 ** 3;

    return [
        {
            ...getStorageSizeFeature(humanSize({ bytes: TWO_HUNDREDS_GIGABYTES, fraction: 0, unit: 'GB' }), true),
            icon: 'storage',
        },
        { name: c('driveplus2024: Deal details').t`Extended version history`, icon: 'clock-rotate-left' },
        { name: c('driveplus2024: Deal details').t`Priority support`, icon: 'life-ring' },
    ];
};

export const getUnlimitedVPNFeatures = () => [
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
    getPremiumDriveFeature(),
    getPremiumInboxFeature(),
];

export const getUnlimitedInboxFeatures = () => [
    getStorageSizeFeature(humanSize({ bytes: 500 * 1024 ** 3, fraction: 0 })),
    { name: c('BF2024: Deal details').t`1 user` },
    getPremiumInboxFeature(3, 15, false),
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
    getPremiumDriveFeature(),
];

export const getUnlimitedInboxFeaturesForPass = () => [
    { name: c('BF2024: Deal details').t`1 user account` },
    getPremiumPasswordManagerFeature(),
    getPremiumInboxFeature(3, 15, false),
    getPremiumVPNFeature(),
    getPremiumDriveFeature(),
    //...getPremiumNonInboxFeature(),
];

export const getDuoInboxFeatures = () => [
    // humanSize doesn't support TB and we don't want to add it yet because of "nice numbers" rounding issues.
    getStorageSizeFeature(c('BF2024: Deal details').t`1 TB total`),
    { name: c('BF2024: Deal details').t`2 users` },
    getPremiumInboxFeature(3, 15),
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
    getPremiumDriveFeature(),
];

export const getFamilyInboxFeatures = () => [
    // humanSize doesn't support TB and we don't want to add it yet because of "nice numbers" rounding issues.
    getStorageSizeFeature(c('BF2024: Deal details').t`3 TB`),
    { name: c('BF2024: Deal details').t`6 users` },
    getPremiumInboxFeature(3, 90),
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
    getPremiumDriveFeature(),
];

export const getDriveFeatures = () => [
    getStorageSizeFeature(humanSize({ bytes: 200 * 1024 ** 3, fraction: 0 })),
    { name: c('BF2024: Deal details').t`Secure file storage & sharing` },
    { name: c('BF2024: Deal details').t`Online document editor` },
    { name: c('BF2024: Deal details').t`Private photo backup` },
    { name: c('BF2024: Deal details').t`Version history` },
];

export const getUnlimitedDriveFeatures = () => [
    getStorageSizeFeature(humanSize({ bytes: 500 * 1024 ** 3, fraction: 0 })),
    { name: c('bf2023: Deal details').t`1 user` },
    getPremiumDriveFeature(),
    getPremiumInboxFeature(3, 15),
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
];

export const getFamilyDriveFeatures = () => [
    // humanSize doesn't support TB and we don't want to add it yet because of "nice numbers" rounding issues.
    getStorageSizeFeature(c('bf2023: Deal details').t`3 TB`),
    { name: c('bf2023: Deal details').t`6 users` },
    getPremiumDriveFeature(),
    getPremiumInboxFeature(3, 90),
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
];

export const getVPNFeatures = () => [
    {
        name: c('BF2024: Deal details').t`8500+ servers across 110+ countries`,
    },
    {
        name: c('BF2024: Deal details').t`Protect 10 devices at a time`,
    },
    {
        name: c('BF2024: Deal details').t`High speed streaming`,
        tooltip: c('BF2024: Tooltip')
            .t`Access content on streaming services including Netflix, Disney+, Prime Video, and more, from anywhere.`,
    },
    {
        name: c('BF2024: Deal details').t`Ad-blocker and malware protection`,
        tooltip: c('BF2024: Tooltip')
            .t`Specially designed NetShield protects your devices and speeds up your browsing by blocking ads, trackers, and malware.`,
    },
    {
        name: c('BF2024: Deal details').t`VPN Accelerator`,
    },
];

export const getVisionaryFeatures = () => [
    // humanSize doesn't support TB and we don't want to add it yet because of "nice numbers" rounding issues.
    getStorageSizeFeature(c('specialoffer: Deal details').t`3 TB`),
    {
        name: c('specialoffer: Deal details').t`6 users`,
        tooltip: c('specialoffer: Tooltip')
            .t`Perfect for families or small teams, each can have their own inbox and aliases. Requires a custom domain.`,
    },
    {
        name: getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME, DRIVE_SHORT_APP_NAME),
        tooltip: c('specialoffer: Tooltip')
            .t`All our premium services with their highest limits: 100 email addresses, support for 10 custom domains, unlimited hide-my-email aliases, calendar sharing, encrypted cloud storage and file sharing, and more.`,
    },
    {
        name: getPremium(VPN_SHORT_APP_NAME),
        tooltip: c('specialoffer: Tooltip')
            .t`Access blocked content and browse privately. Includes 1700 servers in 60+ countries, highest VPN speed, 10 VPN connections per user, worldwide streaming services, malware and ad-blocker, and more.`,
    },
    {
        name: c('specialoffer: Deal details').t`Premium early access`,
        tooltip: c('specialoffer: Tooltip')
            .t`Receive at no extra cost the paid versions of all new privacy services we release in the future, along with early access to all future features and products.`,
    },
    {
        name: c('specialoffer: Deal details').t`Support online privacy`,
    },
];

export const getFamilyFeatures = () => [
    {
        name: c('familyOffer_2023:Deal details').t`Up to 6 users`,
    },
    {
        name: c('familyOffer_2023: Deal details').t`3 TB total storage`,
        tooltip: c('familyOffer_2023: Tooltip')
            .t`Storage space is shared between family members across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME}.`,
    },
    {
        name: getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME),
        tooltip: c('familyOffer_2023:Tooltip')
            .t`Includes support for 3 custom email domains, 90 email addresses, unlimited hide-my-email aliases, calendar sharing and more.`,
    },
    {
        name: getPremium(DRIVE_SHORT_APP_NAME),
        tooltip: c('familyOffer_2023:Tooltip')
            .t`Secure your files with encrypted cloud storage. Includes automatic sync, encrypted file sharing, and more.`,
    },
    {
        name: getPremium(VPN_SHORT_APP_NAME),
        tooltip: c('familyOffer_2023:Tooltip')
            .t`Includes 2700 servers in 65+ countries, connect up to 10 devices, access worldwide streaming services, malware and ad-blocker, and more.`,
    },
    {
        name: getPremiumPasswordManagerText(),
        tooltip: c('summer2023: Tooltip')
            .t`Create secure login details on all your devices. Includes unlimited aliases, 20 vaults, integrated 2FA, credit card auto-fill and more.`,
    },
];

export const getDealBilledDescription = (
    cycle: CYCLE,
    amount: ReactElement,
    isLifeTime?: boolean
): string | string[] | null => {
    if (isLifeTime === true) {
        return c('BF2024: Offers').jt`Billed at ${amount} once`;
    }
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('specialoffer: Offers').jt`Billed at ${amount} for 1 month`;
        case CYCLE.YEARLY:
            return c('specialoffer: Offers').jt`Billed at ${amount} for 12 months`;
        case CYCLE.TWO_YEARS:
            return c('specialoffer: Offers').jt`Billed at ${amount} for 24 months`;
        case CYCLE.FIFTEEN:
            return c('specialoffer: Offers').jt`Billed at ${amount} for 15 months`;
        case CYCLE.THIRTY:
            return c('specialoffer: Offers').jt`Billed at ${amount} for 30 months`;
        default:
            return null;
    }
};

export const getStandardPriceDescription = (cycle: CYCLE, amount: ReactElement): string | string[] | null => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('specialoffer: Offers').jt`Standard price ${amount} for 1 month`;
        case CYCLE.YEARLY:
            return c('specialoffer: Offers').jt`Standard price ${amount} for 12 months`;
        case CYCLE.TWO_YEARS:
            return c('specialoffer: Offers').jt`Standard price ${amount} for 24 months`;
        case CYCLE.FIFTEEN:
            return c('specialoffer: Offers').jt`Standard price ${amount} for 15 months`;
        case CYCLE.THIRTY:
            return c('specialoffer: Offers').jt`Standard price ${amount} for 30 months`;
        default:
            return null;
    }
};

export const getDealDurationText = (cycle: CYCLE | undefined) => {
    const n = Number(cycle);

    if (n === 12) {
        return c('specialoffer: Offers').t`1 year`;
    }

    if (n === 24) {
        return c('specialoffer: Offers').t`2 years`;
    }

    if (n === 15) {
        return c('specialoffer: Offers').t`15 months`;
    }

    if (n === 30) {
        return c('specialoffer: Offers').t`30 months`;
    }

    return c('specialoffer: Offers').ngettext(msgid`${n} month`, `${n} months`, n);
};

export const getDealMonthDurationText = (cycle: CYCLE | undefined) => {
    const n = Number(cycle);

    if (n === 12) {
        return c('Valentine_2025: Offers').t`12 months`;
    }

    if (n === 24) {
        return c('Valentine_2025: Offers').t`24 months`;
    }

    if (n === 15) {
        return c('Valentine_2025: Offers').t`15 months`;
    }

    if (n === 30) {
        return c('Valentine_2025: Offers').t`30 months`;
    }

    return c('Valentine_2025: Offers').ngettext(msgid`${n} month`, `${n} months`, n);
};

export const getDealDuration = (cycle: CYCLE): ReactElement | null => {
    return <>{getDealDurationText(cycle)}</>;
};

export const getRenewDescription = (
    cycle: CYCLE,
    discountedAmount: ReactElement,
    regularAmount: ReactElement,
    discount: number
): string | string[] | null => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('BF2024: Offers').jt`Renews after 1 month at ${regularAmount}.`;
        case CYCLE.YEARLY:
            return c('specialoffer: Offers')
                .jt`Renews after 1 year at a discounted price of ${discountedAmount} instead of ${regularAmount} (${discount}% discount)`;
        case CYCLE.TWO_YEARS:
            return c('specialoffer: Offers')
                .jt`Renews after 2 years at a discounted price of ${discountedAmount} instead of ${regularAmount} (${discount}% discount)`;
        default:
            return null;
    }
};
