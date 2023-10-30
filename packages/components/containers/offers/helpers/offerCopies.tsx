import { ReactElement } from 'react';

import { c, msgid } from 'ttag';

import {
    BRAND_NAME,
    CALENDAR_APP_NAME,
    CALENDAR_SHORT_APP_NAME,
    CYCLE,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PLANS,
    PLAN_NAMES,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

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
        name: c('bf2023: Deal details').t`${storageSize} storage`,
        tooltip: vpn ? undefined : c('bf2023: Tooltip').t`Storage space is shared across all ${BRAND_NAME} apps.`,
    };
};

export const getUnlimitedFeatures = () => {
    return [
        getStorageSizeFeature(humanSize(500 * 1024 ** 3, undefined, undefined, 0)),
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
        getStorageSizeFeature(humanSize(15 * 1024 ** 3, undefined, undefined, 0)),
        {
            name: c('summer2023: Deal details').t`Premium ${MAIL_SHORT_APP_NAME} & ${CALENDAR_SHORT_APP_NAME}`,
            tooltip: c('summer2023: Tooltip')
                .t`Includes support for 1 custom email domain, 10 email addresses, 10 hide-my-email aliases, calendar sharing, and more.`,
        },
    ];
};

export const getUnlimitedDealFeatures = () => {
    return [
        getStorageSizeFeature(humanSize(500 * 1024 ** 3, undefined, undefined, 0)),
        {
            name: c('specialoffer: Deal details').t`Premium ${MAIL_SHORT_APP_NAME} & ${CALENDAR_SHORT_APP_NAME}`,
            tooltip: c('specialoffer: Tooltip')
                .t`Includes support for 3 custom email domains, 15 email addresses, unlimited hide-my-email aliases, calendar sharing, and more.`,
        },
        {
            name: c('summer2023: Deal details').t`Premium ${DRIVE_SHORT_APP_NAME}`,
            tooltip: c('summer2023: Tooltip')
                .t`Secure your files with encrypted cloud storage. Includes version history, encrypted file sharing, and more.`,
        },
        {
            name: c('specialoffer: Deal details').t`Premium ${VPN_SHORT_APP_NAME}`,
            tooltip: c('summer2023: Tooltip')
                .t`Includes 2950+ servers in 65+ countries, connect up to 10 devices, access worldwide streaming services, malware and ad-blocker, and more.`,
        },
        {
            name: c('summer2023: Deal details').t`Premium Password Manager`,
            tooltip: c('summer2023: Tooltip')
                .t`Create secure login details on all your devices. Includes unlimited aliases, 20 vaults, integrated 2FA, credit card auto-fill and more.`,
        },
    ];
};

const getPremiumVPNFeature = () => ({
    name: PLAN_NAMES[PLANS.VPN],
    tooltip: c('bf2023: Tooltip')
        .t`Access blocked content and browse privately. Includes 3,000+ servers across 65+ countries, highest VPN speeds, access to worldwide streaming services, malware and ad-blocker, fast BitTorrent downloads, and more.`,
});

const getPremiumPasswordManagerFeature = () => ({
    name: PLAN_NAMES[PLANS.PASS_PLUS],
    tooltip: c('bf2023: Tooltip')
        .t`Secure logins on all your devices. Includes unlimited aliases, sharing, integrated 2FA, and more.`,
});

const getPremiumDriveFeature = () => ({
    name: PLAN_NAMES[PLANS.DRIVE],
    tooltip: c('bf2023: Tooltip')
        .t`Secure your files with encrypted cloud storage. Includes version history, encrypted file sharing, and more.`,
});

const getPremiumInboxFeature = (domains?: number, addresses?: number) => {
    const name = c('bf2023: Deal details').t`${MAIL_SHORT_APP_NAME} Plus and ${CALENDAR_SHORT_APP_NAME}`;

    if (domains && addresses) {
        if (domains === 1) {
            return {
                name: c('bf2023: Deal details').t`All paid ${MAIL_SHORT_APP_NAME} and ${CALENDAR_APP_NAME} features`,
                tooltip: c('bf2023: Tooltip')
                    .t`Includes support for 1 custom email domain, 10 email addresses, 10 hide-my-email aliases, calendar sharing, and more.`,
            };
        }

        return {
            name,
            tooltip: c('bf2023: Tooltip').ngettext(
                msgid`Includes support for 3 custom email domains, ${addresses} email address, unlimited hide-my-email aliases, calendar sharing, and more.`,
                `Includes support for 3 custom email domains, ${addresses} email addresses, unlimited hide-my-email aliases, calendar sharing, and more.`,
                addresses
            ),
        };
    }

    return {
        name,
        tooltip: c('bf2023: Tooltip')
            .t`Secure your emails and schedule with end-to-end encryption. Includes support for custom email domains, 15 email addresses, unlimited hide-my-email aliases, calendar sharing, and more.`,
    };
};

export const getMailPlusInboxFeatures = () => {
    return [
        getStorageSizeFeature(humanSize(15 * 1024 ** 3, undefined, undefined, 0)),
        {
            name: c('specialoffer: Deal details').t`1 user`,
        },
        getPremiumInboxFeature(1, 10),
    ];
};

export const getUnlimitedVPNFeatures = () => [
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
    getPremiumDriveFeature(),
    getPremiumInboxFeature(),
];

export const getUnlimitedInboxFeatures = () => [
    getStorageSizeFeature(humanSize(500 * 1024 ** 3, undefined, undefined, 0)),
    { name: c('bf2023: Deal details').t`1 user` },
    getPremiumInboxFeature(3, 15),
    getPremiumDriveFeature(),
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
];

export const getFamilyInboxFeatures = () => [
    // humanSize doesn't support TB and we don't want to add it yet because of "nice numbers" rounding issues.
    getStorageSizeFeature(c('bf2023: Deal details').t`3 TB`),
    { name: c('bf2023: Deal details').t`6 users` },
    getPremiumInboxFeature(3, 90),
    getPremiumDriveFeature(),
    getPremiumVPNFeature(),
    getPremiumPasswordManagerFeature(),
];

export const getDriveFeatures = () => [
    getStorageSizeFeature(humanSize(200 * 1024 ** 3, undefined, undefined, 0)),
    { name: c('bf2023: Deal details').t`1 user` },
    {
        name: c('bf2023: Deal details').t`Extended version history`,
        tooltip: c('bf2023: Tooltip').t`Store up to 200 versions of each file for up to 10 years.`,
    },
];

export const getUnlimitedDriveFeatures = () => [
    getStorageSizeFeature(humanSize(500 * 1024 ** 3, undefined, undefined, 0)),
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
        name: c('bf2023: Deal details').t`3,000+ servers across 65+ countries`,
    },
    {
        name: c('bf2023: Deal details').t`High speed streaming`,
        tooltip: c('bf2023: Tooltip')
            .t`Access content on streaming services including Netflix, Disney+, Prime Video, and more, from anywhere.`,
    },
    {
        name: c('bf2023: Deal details').t`Ad-blocker and malware protection`,
        tooltip: c('bf2023: Tooltip')
            .t`Specially designed NetShield protects your devices and speeds up your browsing by blocking ads, trackers, and malware.`,
    },
    {
        name: c('bf2023: Deal details').t`Access content worldwide`,
        tooltip: c('bf2023: Tooltip')
            .t`Bypass local internet blocks and censorship with our global network of servers.`,
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
        name: c('specialoffer: Deal details')
            .t`Premium ${MAIL_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME} & ${DRIVE_SHORT_APP_NAME}`,
        tooltip: c('specialoffer: Tooltip')
            .t`All our premium services with their highest limits: 100 email addresses, support for 10 custom domains, unlimited hide-my-email aliases, calendar sharing, encrypted cloud storage and file sharing, and more.`,
    },
    {
        name: c('specialoffer: Deal details').t`Premium ${VPN_SHORT_APP_NAME}`,
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
        name: c('familyOffer_2023:Deal details').t`Premium ${MAIL_SHORT_APP_NAME} & ${CALENDAR_SHORT_APP_NAME}`,
        tooltip: c('familyOffer_2023:Tooltip')
            .t`Includes support for 3 custom email domains, 90 email addresses, unlimited hide-my-email aliases, calendar sharing and more.`,
    },
    {
        name: c('familyOffer_2023:Deal details').t`Premium ${DRIVE_SHORT_APP_NAME}`,
        tooltip: c('familyOffer_2023:Tooltip')
            .t`Secure your files with encrypted cloud storage. Includes automatic sync, encrypted file sharing, and more.`,
    },
    {
        name: c('familyOffer_2023:Deal details').t`Premium ${VPN_SHORT_APP_NAME}`,
        tooltip: c('familyOffer_2023:Tooltip')
            .t`Includes 2700 servers in 65+ countries, connect up to 10 devices, access worldwide streaming services, malware and ad-blocker, and more.`,
    },
    {
        name: c('summer2023: Deal details').t`Premium Password Manager`,
        tooltip: c('summer2023: Tooltip')
            .t`Create secure login details on all your devices. Includes unlimited aliases, 20 vaults, integrated 2FA, credit card auto-fill and more.`,
    },
];

export const getVPNPlusFeatures = () => [
    {
        name: c('specialoffer: Deal details').t`64 countries`,
    },
    {
        name: c('specialoffer: Deal details').t`Highest VPN speed`,
    },
    {
        name: c('specialoffer: Deal details').t`Secure streaming`,
        tooltip: c('specialoffer: Tooltip')
            .t`Access content on streaming services, including Netflix, Disney+, and Prime Video, from anywhere.`,
    },
];

export const getDealBilledDescription = (cycle: CYCLE, amount: ReactElement): string | string[] | null => {
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

const getDealDurationText = (cycle: CYCLE | undefined) => {
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
