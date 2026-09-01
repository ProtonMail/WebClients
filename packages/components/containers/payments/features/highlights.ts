import { c, msgid } from 'ttag';

import { IcImage } from '@proton/icons/icons/IcImage';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcPenSparks } from '@proton/icons/icons/IcPenSparks';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { PLANS } from '@proton/payments/core/constants';
import type { FreePlanDefault, PlansMap } from '@proton/payments/core/plan/interface';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    DUO_MAX_USERS,
    FAMILY_MAX_USERS,
    LUMO_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    MEET_APP_NAME,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    PROTON_SENTINEL_NAME,
    VISIONARY_MAX_USERS,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { getStandaloneUnleashClient } from '@proton/unleash/standaloneClient';

import { getStorage } from './drive';
import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';
import { getPassMonitorText } from './pass';

export const getNUsersAdminText = ({ n, admins, users }: { n: number; admins: number; users: number }) => {
    const adminsText = c('new_plans: feature highlight').ngettext(msgid`${admins} admin`, `${admins} admins`, admins);
    const usersText = c('new_plans: feature highlight').ngettext(msgid`${users} user`, `${users} users`, users);

    // translator: Full text: "Up to 6 users (1 admin, 5 users)"
    return c('new_plans: feature').ngettext(
        msgid`Up to ${n} user (${adminsText}, ${usersText})`,
        `Up to ${n} users (${adminsText}, ${usersText})`,
        n
    );
};

export const getNUsersText = (n: number) => {
    return c('new_plans: feature').ngettext(msgid`Up to ${n} user`, `Up to ${n} users`, n);
};

export const getFreeUsersText = () => {
    return c('new_plans: feature').t`1 user`;
};

const getUsers = (): PlanCardFeature => {
    return {
        name: 'user-number',
        target: Audience.FAMILY,
        plans: {
            [PLANS.FREE]: {
                id: 'user-number',
                text: getFreeUsersText(),
                included: true,
            },
            [PLANS.BUNDLE]: null,
            [PLANS.MAIL]: null,
            [PLANS.VPN2024]: null,
            [PLANS.PASS]: null,
            [PLANS.PASS_LIFETIME]: null,
            [PLANS.DRIVE]: null,
            [PLANS.DRIVE_1TB]: null,
            [PLANS.DRIVE_BUSINESS]: null,
            [PLANS.FAMILY]: {
                id: 'user-number',
                text: getNUsersText(FAMILY_MAX_USERS),
                included: true,
                highlight: true,
            },
            [PLANS.DUO]: {
                id: 'user-number',
                text: getNUsersText(DUO_MAX_USERS),
                included: true,
                highlight: true,
            },
            [PLANS.MAIL_PRO]: null,
            [PLANS.MAIL_BUSINESS]: null,
            [PLANS.BUNDLE_PRO]: null,
            [PLANS.BUNDLE_PRO_2024]: null,
            [PLANS.BUNDLE_BIZ_2025]: null,
            [PLANS.PASS_PRO]: null,
            [PLANS.PASS_FAMILY]: {
                id: 'user-number',
                text: getNUsersAdminText({ n: FAMILY_MAX_USERS, admins: 1, users: FAMILY_MAX_USERS - 1 }),
                included: true,
                highlight: true,
            },
            [PLANS.PASS_BUSINESS]: null,
            [PLANS.VPN_PRO]: null,
            [PLANS.VPN_BUSINESS]: null,
            [PLANS.LUMO]: null,
            [PLANS.LUMO_BUSINESS]: null,
            [PLANS.MEET_BUSINESS]: null,
            [PLANS.MEET]: null,
            [PLANS.VISIONARY]: {
                id: 'user-number',
                text: getNUsersText(VISIONARY_MAX_USERS),
                included: true,
                highlight: true,
            },
            [PLANS.VPN_PASS_BUNDLE_BUSINESS]: null,
        },
    };
};

export const getUsersFeature = (n: number): PlanCardFeatureDefinition => {
    return {
        id: 'users',
        text: n === 1 ? getFreeUsersText() : getNUsersText(n),
        icon: IcUsers,
        included: true,
    };
};

export const getSupport = (
    type: 'limited' | 'priority',
    product?: 'drive' | 'mail' | 'pass' | 'vpn' | 'meet' | 'all'
): PlanCardFeatureDefinition => {
    const text =
        type === 'limited' ? c('new_plans: feature').t`Limited support` : c('new_plans: feature').t`Priority support`;

    let subtext = undefined;
    switch (product) {
        case 'drive':
            subtext = c('customer_support.feature.drive').t`For ${DRIVE_APP_NAME}`;
            break;
        case 'mail':
            subtext = c('customer_support.feature.mail').t`For ${MAIL_APP_NAME}`;
            break;
        case 'pass':
            subtext = c('customer_support.feature.pass').t`For ${PASS_APP_NAME}`;
            break;
        case 'vpn':
            subtext = c('customer_support.feature.vpn').t`For ${VPN_APP_NAME}`;
            break;
        case 'meet':
            subtext = c('customer_support.feature.meet').t`For ${MEET_APP_NAME}`;
            break;
        case 'all':
            subtext = c('customer_support.feature.all').t`For all ${BRAND_NAME} services`;
            break;
    }

    return {
        id: 'support',
        text,
        subtext,
        included: true,
        icon: IcLifeRing,
    };
};

export const get24x7Support = (): PlanCardFeatureDefinition => ({
    id: '24x7-support',
    included: true,
    text: c('new_plans: feature').t`24/7 account management support`,
});

export const getAllPremiumServices = (): PlanCardFeatureDefinition => ({
    id: 'all-premium-services',
    included: true,
    text: c('Plan description')
        .t`All premium features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
});

export const getSentinel = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        id: 'sentinel',
        text: c('new_plans: feature').t`${PROTON_SENTINEL_NAME} program`,
        tooltip: c('new_plans: tooltip')
            .t`Provides the highest level of account security protection and specialist support`,
        included: included,
        icon: IcShield,
    };
};

export const getAdvancedAccountProtectionFeature = (included: boolean = true): PlanCardFeatureDefinition => {
    return {
        id: 'advanced-account-protection',
        text: c('pass_signup_2024: Info').t`Advanced account protection`,
        icon: IcLock,
        included,
    };
};

export const getPassMonitor = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        id: 'pass-monitor',
        text: getPassMonitorText(),
        included: included,
        icon: IcShield,
    };
};

export const getPassDarkWebMonitoring = (): PlanCardFeatureDefinition => {
    return {
        id: 'pass-dark-web-monitoring',
        included: true,
        text: DARK_WEB_MONITORING_NAME,
        icon: IcLock,
    };
};

export const getPassKeys = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        id: 'pass-keys',
        text: c('new_plans: feature').t`Passkeys supported`,
        included: included,
        icon: IcShield,
    };
};

export const getAdminPanel = (): PlanCardFeatureDefinition => {
    return {
        id: 'admin-panel',
        text: c('new_plans: feature').t`Administration Panel`,
        included: true,
    };
};

export const getCustomBranding = (included: boolean): PlanCardFeatureDefinition => {
    return {
        id: 'custom-branding',
        text: c('new_plans: feature').t`Custom workspace branding`,
        tooltip: c('new_plans: tooltip')
            .t`Upload your business' logo to customize your teams experience on the ${BRAND_NAME} web apps`,
        included,
        icon: IcImage,
    };
};

export const getHighlightFeatures = (plansMap: PlansMap, freePlan: FreePlanDefault): PlanCardFeature[] => {
    return [
        getUsers(),
        getStorage(plansMap, freePlan),
        {
            name: 'support',
            plans: {
                [PLANS.FREE]: getSupport('limited'),
                [PLANS.BUNDLE]: getSupport('priority'),
                [PLANS.MAIL]: getSupport('priority'),
                [PLANS.VPN2024]: getSupport('priority'),
                [PLANS.DRIVE]: getSupport('priority'),
                [PLANS.DRIVE_1TB]: getSupport('priority'),
                [PLANS.DRIVE_BUSINESS]: getSupport('priority', 'drive'),
                [PLANS.PASS]: getSupport('priority'),
                [PLANS.PASS_LIFETIME]: getSupport('priority'),
                [PLANS.FAMILY]: getSupport('priority'),
                [PLANS.DUO]: getSupport('priority'),
                [PLANS.MAIL_PRO]: getSupport('priority', 'mail'),
                [PLANS.MAIL_BUSINESS]: getSupport('priority', 'mail'),
                [PLANS.BUNDLE_PRO]: getSupport('priority', 'all'),
                [PLANS.BUNDLE_PRO_2024]: getSupport('priority', 'all'),
                [PLANS.BUNDLE_BIZ_2025]: getSupport('priority', 'all'),
                [PLANS.PASS_PRO]: get24x7Support(),
                [PLANS.PASS_FAMILY]: getSupport('priority'),
                [PLANS.PASS_BUSINESS]: get24x7Support(),
                [PLANS.VPN_PRO]: getSupport('priority', 'vpn'),
                [PLANS.VPN_BUSINESS]: getSupport('priority', 'vpn'),
                [PLANS.LUMO]: getSupport('priority'),
                [PLANS.LUMO_BUSINESS]: getSupport('priority'),
                [PLANS.MEET_BUSINESS]: getSupport('priority', 'meet'),
                [PLANS.MEET]: getSupport('priority', 'meet'),
                [PLANS.VISIONARY]: getSupport('priority'),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getSupport('priority'),
            },
        },
        {
            name: 'sentinel',
            plans: {
                [PLANS.FREE]: getSentinel(),
                [PLANS.BUNDLE]: getSentinel(true),
                [PLANS.MAIL]: getSentinel(),
                [PLANS.VPN2024]: getSentinel(),
                [PLANS.DRIVE]: getSentinel(),
                [PLANS.DRIVE_1TB]: getSentinel(),
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: getSentinel(true),
                [PLANS.PASS_LIFETIME]: getSentinel(true),
                [PLANS.FAMILY]: getSentinel(true),
                [PLANS.DUO]: getSentinel(true),
                [PLANS.MAIL_PRO]: getSentinel(),
                [PLANS.MAIL_BUSINESS]: getSentinel(true),
                [PLANS.BUNDLE_PRO]: getSentinel(true),
                [PLANS.BUNDLE_PRO_2024]: getSentinel(true),
                [PLANS.BUNDLE_BIZ_2025]: getSentinel(true),
                [PLANS.PASS_PRO]: getSentinel(),
                [PLANS.PASS_FAMILY]: getSentinel(true),
                [PLANS.PASS_BUSINESS]: getSentinel(true),
                [PLANS.VPN_PRO]: getSentinel(),
                [PLANS.VPN_BUSINESS]: getSentinel(true),
                [PLANS.LUMO]: getSentinel(),
                [PLANS.LUMO_BUSINESS]: null,
                [PLANS.MEET_BUSINESS]: getSentinel(false),
                [PLANS.MEET]: getSentinel(false),
                [PLANS.VISIONARY]: getSentinel(true),
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getSentinel(true),
            },
        },
        {
            name: 'custom-branding',
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN2024]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_1TB]: null,
                [PLANS.DRIVE_BUSINESS]: getCustomBranding(true),
                [PLANS.PASS]: null,
                [PLANS.PASS_LIFETIME]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getCustomBranding(false),
                [PLANS.MAIL_BUSINESS]: getCustomBranding(true),
                [PLANS.BUNDLE_PRO]: getCustomBranding(true),
                [PLANS.BUNDLE_PRO_2024]: getCustomBranding(true),
                [PLANS.BUNDLE_BIZ_2025]: getCustomBranding(true),
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_FAMILY]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
                [PLANS.LUMO]: null,
                [PLANS.LUMO_BUSINESS]: null,
                [PLANS.MEET_BUSINESS]: null,
                [PLANS.MEET]: null,
                [PLANS.VISIONARY]: null,
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: null,
            },
        },
        {
            name: 'admin-panel',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN2024]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_1TB]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.PASS_LIFETIME]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.BUNDLE_BIZ_2025]: getAdminPanel(),
                [PLANS.PASS_PRO]: getAdminPanel(),
                [PLANS.PASS_FAMILY]: getAdminPanel(),
                [PLANS.PASS_BUSINESS]: getAdminPanel(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
                [PLANS.LUMO]: null,
                [PLANS.LUMO_BUSINESS]: null,
                [PLANS.MEET_BUSINESS]: null,
                [PLANS.MEET]: null,
                [PLANS.VISIONARY]: null,
                [PLANS.VPN_PASS_BUNDLE_BUSINESS]: getAdminPanel(),
            },
        },
    ];
};

export const getScribeFeature = (): PlanCardFeatureDefinition => {
    const scribeToLumo = getStandaloneUnleashClient()?.isEnabled(MailFeatureFlag.ScribeToLumo);
    return {
        id: 'scribe',
        text: scribeToLumo
            ? c('mail_signup_2024: Info').t`${LUMO_SHORT_APP_NAME} writing assistant`
            : c('mail_signup_2024: Info').t`${BRAND_NAME} Scribe writing assistant`,
        icon: IcPenSparks,
        included: true,
        tooltip: c('mail_signup_2024: Info').t`Add-on with free trial`,
    };
};
