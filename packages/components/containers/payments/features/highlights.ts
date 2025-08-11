import { c, msgid } from 'ttag';

import { type FreePlanDefault, PLANS, type PlansMap } from '@proton/payments';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    DUO_MAX_USERS,
    FAMILY_MAX_USERS,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    PROTON_SENTINEL_NAME,
    VISIONARY_MAX_USERS,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

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
            [PLANS.WALLET]: null,
            [PLANS.FAMILY]: {
                text: getNUsersText(FAMILY_MAX_USERS),
                included: true,
                highlight: true,
            },
            [PLANS.DUO]: {
                text: getNUsersText(DUO_MAX_USERS),
                included: true,
                highlight: true,
            },
            [PLANS.MAIL_PRO]: null,
            [PLANS.MAIL_BUSINESS]: null,
            [PLANS.BUNDLE_PRO]: null,
            [PLANS.BUNDLE_PRO_2024]: null,
            [PLANS.PASS_PRO]: null,
            [PLANS.PASS_FAMILY]: {
                text: getNUsersAdminText({ n: FAMILY_MAX_USERS, admins: 1, users: FAMILY_MAX_USERS - 1 }),
                included: true,
                highlight: true,
            },
            [PLANS.PASS_BUSINESS]: null,
            [PLANS.VPN_PRO]: null,
            [PLANS.VPN_BUSINESS]: null,
            [PLANS.LUMO]: null,
            [PLANS.VISIONARY]: {
                text: getNUsersText(VISIONARY_MAX_USERS),
                included: true,
                highlight: true,
            },
        },
    };
};

export const getUsersFeature = (n: number): PlanCardFeatureDefinition => {
    return {
        text: n === 1 ? getFreeUsersText() : getNUsersText(n),
        icon: 'users',
        included: true,
    };
};

export const getSupport = (
    type: 'limited' | 'priority',
    product?: 'drive' | 'mail' | 'pass' | 'vpn' | 'all'
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
        case 'all':
            subtext = c('customer_support.feature.all').t`For all ${BRAND_NAME} services`;
            break;
    }

    return {
        text,
        subtext,
        included: true,
        icon: 'life-ring',
    };
};

export const get24x7Support = (): PlanCardFeatureDefinition => ({
    included: true,
    text: c('new_plans: feature').t`24/7 account management support`,
});

export const getAllPremiumServices = (): PlanCardFeatureDefinition => ({
    included: true,
    text: c('Plan description')
        .t`All premium features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
});

export const getSentinel = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`${PROTON_SENTINEL_NAME} program`,
        tooltip: c('new_plans: tooltip')
            .t`Provides the highest level of account security protection and specialist support`,
        included: included,
        icon: 'shield',
    };
};

export const getAdvancedAccountProtectionFeature = (included: boolean = true): PlanCardFeatureDefinition => {
    return {
        text: c('pass_signup_2024: Info').t`Advanced account protection`,
        icon: 'lock',
        included,
    };
};

export const getPassMonitor = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: getPassMonitorText(),
        included: included,
        icon: 'shield',
    };
};

export const getPassKeys = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Passkeys supported`,
        included: included,
        icon: 'shield',
    };
};

export const getAdminPanel = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Administration Panel`,
        included: true,
    };
};

export const getCustomBranding = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Custom workspace branding`,
        tooltip: c('new_plans: tooltip')
            .t`Upload your business' logo to customize your teams experience on the ${BRAND_NAME} web apps`,
        included,
        icon: 'image',
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
                [PLANS.WALLET]: getSupport('priority'),
                [PLANS.FAMILY]: getSupport('priority'),
                [PLANS.DUO]: getSupport('priority'),
                [PLANS.MAIL_PRO]: getSupport('priority', 'mail'),
                [PLANS.MAIL_BUSINESS]: getSupport('priority', 'mail'),
                [PLANS.BUNDLE_PRO]: getSupport('priority', 'all'),
                [PLANS.BUNDLE_PRO_2024]: getSupport('priority', 'all'),
                [PLANS.PASS_PRO]: get24x7Support(),
                [PLANS.PASS_FAMILY]: getSupport('priority'),
                [PLANS.PASS_BUSINESS]: get24x7Support(),
                [PLANS.VPN_PRO]: getSupport('priority', 'vpn'),
                [PLANS.VPN_BUSINESS]: getSupport('priority', 'vpn'),
                [PLANS.LUMO]: getSupport('priority'),
                [PLANS.VISIONARY]: getSupport('priority'),
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
                [PLANS.WALLET]: getSentinel(true),
                [PLANS.FAMILY]: getSentinel(true),
                [PLANS.DUO]: getSentinel(true),
                [PLANS.MAIL_PRO]: getSentinel(),
                [PLANS.MAIL_BUSINESS]: getSentinel(true),
                [PLANS.BUNDLE_PRO]: getSentinel(true),
                [PLANS.BUNDLE_PRO_2024]: getSentinel(true),
                [PLANS.PASS_PRO]: getSentinel(),
                [PLANS.PASS_FAMILY]: getSentinel(true),
                [PLANS.PASS_BUSINESS]: getSentinel(true),
                [PLANS.VPN_PRO]: getSentinel(),
                [PLANS.VPN_BUSINESS]: getSentinel(true),
                [PLANS.LUMO]: getSentinel(),
                [PLANS.VISIONARY]: getSentinel(true),
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
                [PLANS.WALLET]: null,
                [PLANS.PASS]: null,
                [PLANS.PASS_LIFETIME]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getCustomBranding(false),
                [PLANS.MAIL_BUSINESS]: getCustomBranding(true),
                [PLANS.BUNDLE_PRO]: getCustomBranding(true),
                [PLANS.BUNDLE_PRO_2024]: getCustomBranding(true),
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_FAMILY]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
                [PLANS.LUMO]: null,
                [PLANS.VISIONARY]: null,
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
                [PLANS.WALLET]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: getAdminPanel(),
                [PLANS.PASS_FAMILY]: getAdminPanel(),
                [PLANS.PASS_BUSINESS]: getAdminPanel(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
                [PLANS.LUMO]: null,
                [PLANS.VISIONARY]: null,
            },
        },
    ];
};

export const getScribeFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('mail_signup_2024: Info').t`${BRAND_NAME} Scribe writing assistant`,
        icon: 'pen-sparks',
        included: true,
        tooltip: c('mail_signup_2024: Info').t`Add-on with free trial`,
    };
};
