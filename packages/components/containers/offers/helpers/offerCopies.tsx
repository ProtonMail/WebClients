import { Fragment, type ReactElement } from 'react';

import { c, msgid } from 'ttag';

import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcPassShieldOk } from '@proton/icons/icons/IcPassShieldOk';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcUsersPlus } from '@proton/icons/icons/IcUsersPlus';
import { CYCLE } from '@proton/payments/core/constants';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { getPremiumPasswordManagerText } from '@proton/shared/lib/helpers/checkout';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getPremium } from '@proton/shared/lib/helpers/premium';

import type { PlanCardFeatureIcon } from '../../payments/features/interface';
import { getOwnDomainText } from '../../payments/features/mail';
import { getSecureVaultSharingText, getUnlimitedHideMyEmailAliasesText } from '../../payments/features/pass';

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

export const getMailPlusInboxFeatures = (): { name: string }[] => {
    return [
        { ...getStorageSizeFeature(humanSize({ bytes: 15 * 1024 ** 3, fraction: 0 }), true) }, // true remove the tooltip
        { name: c('BF2024: Deal details').t`Unlimited folders, labels and filters` },
        { name: getOwnDomainText() },
    ];
};

export const getTryDrivePlus2024Features = (): { name: string; icon: PlanCardFeatureIcon }[] => {
    const TWO_HUNDREDS_GIGABYTES = 200 * 1024 ** 3;

    return [
        {
            ...getStorageSizeFeature(humanSize({ bytes: TWO_HUNDREDS_GIGABYTES, fraction: 0, unit: 'GB' }), true),
            icon: IcStorage,
        },
        { name: c('driveplus2024: Deal details').t`Extended version history`, icon: IcClockRotateLeft },
        { name: c('driveplus2024: Deal details').t`Priority support`, icon: IcLifeRing },
    ];
};

export const getTryPassPlus2024Features = (): { name: string; icon: PlanCardFeatureIcon }[] => [
    { name: getUnlimitedHideMyEmailAliasesText(), icon: IcAlias },
    { name: getSecureVaultSharingText(), icon: IcUsersPlus },
    { name: DARK_WEB_MONITORING_NAME, icon: IcPassShieldOk },
];

export const getDealBilledDescription = (
    cycle: CYCLE,
    amount: ReactElement,
    isLifeTime?: boolean
): string | string[] | null => {
    if (isLifeTime) {
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

export const getDealDuration = (cycle: CYCLE): ReactElement | null => {
    return <Fragment key={`deal-duration-${cycle}`}>{getDealDurationText(cycle)}</Fragment>;
};
