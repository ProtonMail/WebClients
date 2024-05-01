import { c, msgid } from 'ttag';

import { FAMILY_MAX_USERS, PLANS, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { Audience, FreePlanDefault, PlansMap } from '@proton/shared/lib/interfaces';

import { getStorage } from './drive';
import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getNUsersText = (n: number) => {
    return c('new_plans: feature').ngettext(msgid`Up to ${n} user`, `Up to ${n} users`, n);
};

const getUsers = (): PlanCardFeature => {
    return {
        name: 'user-number',
        target: Audience.FAMILY,
        plans: {
            [PLANS.FREE]: {
                text: c('new_plans: feature').t`1 user`,
                included: true,
            },
            [PLANS.BUNDLE]: null,
            [PLANS.MAIL]: null,
            [PLANS.VPN]: null,
            [PLANS.PASS_PLUS]: null,
            [PLANS.DRIVE]: null,
            [PLANS.FAMILY]: {
                text: getNUsersText(FAMILY_MAX_USERS),
                included: true,
                highlight: true,
            },
            [PLANS.MAIL_PRO]: null,
            [PLANS.BUNDLE_PRO]: null,
            [PLANS.PASS_PRO]: null,
            [PLANS.PASS_BUSINESS]: null,
            [PLANS.VPN_PRO]: null,
            [PLANS.VPN_BUSINESS]: null,
        },
    };
};

export const getUsersFeature = (n: number): PlanCardFeatureDefinition => {
    return {
        text: getNUsersText(n),
        icon: 'users',
        included: true,
    };
};

export const getSupport = (type: 'limited' | 'priority'): PlanCardFeatureDefinition => {
    return {
        text:
            type === 'limited'
                ? c('new_plans: feature').t`Limited support`
                : c('new_plans: feature').t`Priority support`,
        included: true,
        icon: 'life-ring',
    };
};

export const get24x7Support = (): PlanCardFeatureDefinition => ({
    included: true,
    text: c('new_plans: feature').t`24/7 account management support`,
});

const getEasySwitch = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Easy Switch import assistant`,
        tooltip: c('new_plans: tooltip').t`Quickly transfer your emails, calendars or contacts from any provider`,
        included: true,
    };
};

export const getSentinel = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`${PROTON_SENTINEL_NAME} program`,
        tooltip: c('new_plans: tooltip')
            .t`Provides the highest level of account security protection and specialist support`,
        included: included,
        icon: 'shield',
    };
};

export const getPassKeys = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Passkeys supported`,
        tooltip: c('new_plans: tooltip')
            .t`Provides the highest level of account security protection and specialist support`,
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
                [PLANS.PASS_PLUS]: getSupport('priority'),
                [PLANS.FAMILY]: getSupport('priority'),
                [PLANS.MAIL_PRO]: getSupport('priority'),
                [PLANS.BUNDLE_PRO]: getSupport('priority'),
                [PLANS.PASS_PRO]: get24x7Support(),
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
                [PLANS.PASS_PLUS]: getSentinel(true),
                [PLANS.FAMILY]: getSentinel(true),
                [PLANS.MAIL_PRO]: getSentinel(),
                [PLANS.BUNDLE_PRO]: getSentinel(true),
                [PLANS.PASS_PRO]: getSentinel(),
                [PLANS.PASS_BUSINESS]: getSentinel(true),
                [PLANS.VPN_PRO]: getSentinel(),
                [PLANS.VPN_BUSINESS]: getSentinel(true),
            },
        },
        {
            name: 'easy-switch',
            plans: {
                [PLANS.FREE]: getEasySwitch(),
                [PLANS.BUNDLE]: getEasySwitch(),
                [PLANS.MAIL]: getEasySwitch(),
                [PLANS.VPN]: getEasySwitch(),
                [PLANS.DRIVE]: getEasySwitch(),
                [PLANS.PASS_PLUS]: getEasySwitch(),
                [PLANS.FAMILY]: getEasySwitch(),
                [PLANS.MAIL_PRO]: getEasySwitch(),
                [PLANS.BUNDLE_PRO]: getEasySwitch(),
                [PLANS.PASS_PRO]: getEasySwitch(),
                [PLANS.PASS_BUSINESS]: getEasySwitch(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.PASS_PRO]: getAdminPanel(),
                [PLANS.PASS_BUSINESS]: getAdminPanel(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};
