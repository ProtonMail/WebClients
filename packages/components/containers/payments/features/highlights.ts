import { c, msgid } from 'ttag';

import { PLANS } from '@proton/payments';
import {
    BRAND_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_APP_NAME,
    DUO_MAX_USERS,
    FAMILY_MAX_USERS,
    PROTON_SENTINEL_NAME,
} from '@proton/shared/lib/constants';
import type { FreePlanDefault, PlansMap } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';

import { getStorage } from './drive';
import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

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
            [PLANS.VPN]: null,
            [PLANS.PASS]: null,
            [PLANS.DRIVE]: null,
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

export const getSupport = (type: 'limited' | 'priority', product?: 'drive' | 'all'): PlanCardFeatureDefinition => {
    const textType =
        type === 'limited' ? c('new_plans: feature').t`Limited support` : c('new_plans: feature').t`Priority support`;

    let text = textType;
    switch (product) {
        case 'drive':
            text = c('new_plans: feature').t`${textType} - For ${DRIVE_APP_NAME}`;
            break;
        case 'all':
            text = c('new_plans: feature').t`${textType} - For all ${BRAND_NAME} services`;
            break;
        default:
            text = textType;
            break;
    }

    return {
        text: text,
        included: true,
        icon: 'life-ring',
    };
};

export const get24x7Support = (): PlanCardFeatureDefinition => ({
    included: true,
    text: c('new_plans: feature').t`24/7 account management support`,
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

export const getPassMonitor = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`${DARK_WEB_MONITORING_NAME} and ${PROTON_SENTINEL_NAME}`,
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
                [PLANS.VPN]: getSupport('priority'),
                [PLANS.DRIVE]: getSupport('priority'),
                [PLANS.DRIVE_BUSINESS]: getSupport('priority', 'drive'),
                [PLANS.PASS]: getSupport('priority'),
                [PLANS.WALLET]: getSupport('priority'),
                [PLANS.FAMILY]: getSupport('priority'),
                [PLANS.DUO]: getSupport('priority'),
                [PLANS.MAIL_PRO]: getSupport('priority'),
                [PLANS.MAIL_BUSINESS]: getSupport('priority'),
                [PLANS.BUNDLE_PRO]: getSupport('priority'),
                [PLANS.BUNDLE_PRO_2024]: getSupport('priority', 'all'),
                [PLANS.PASS_PRO]: get24x7Support(),
                [PLANS.PASS_FAMILY]: getSupport('priority'),
                [PLANS.PASS_BUSINESS]: get24x7Support(),
                [PLANS.VPN_PRO]: getSupport('priority'),
                [PLANS.VPN_BUSINESS]: getSupport('priority'),
            },
        },
        {
            name: 'sentinel',
            plans: {
                [PLANS.FREE]: getSentinel(),
                [PLANS.BUNDLE]: getSentinel(true),
                [PLANS.MAIL]: getSentinel(),
                [PLANS.VPN]: getSentinel(),
                [PLANS.DRIVE]: getSentinel(),
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: getSentinel(true),
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
            },
        },
        {
            name: 'custom-branding',
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getCustomBranding(true),
                [PLANS.WALLET]: null,
                [PLANS.PASS]: null,
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
            },
        },
        {
            name: 'admin-panel',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
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
            },
        },
    ];
};
