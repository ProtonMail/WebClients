import { c } from 'ttag';

import { FAMILY_MAX_USERS, PLANS } from '@proton/shared/lib/constants';
import { Audience, PlansMap } from '@proton/shared/lib/interfaces';

import { getStorage } from './drive';
import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

const getUsers = (): PlanCardFeature => {
    return {
        name: 'user-number',
        target: Audience.FAMILY,
        plans: {
            [PLANS.FREE]: {
                featureName: c('new_plans: feature').t`1 user`,
                tooltip: '',
                included: true,
            },
            [PLANS.BUNDLE]: null,
            [PLANS.MAIL]: null,
            [PLANS.VPN]: null,
            [PLANS.DRIVE]: null,
            [PLANS.FAMILY]: {
                featureName: c('new_plans: feature').t`Up to ${FAMILY_MAX_USERS} users`,
                tooltip: '',
                included: true,
                fire: true,
            },
            [PLANS.MAIL_PRO]: null,
            [PLANS.BUNDLE_PRO]: null,
        },
    };
};

export const getUsersFeature = (n: number): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Up to ${n} users`,
        tooltip: '',
        icon: 'users',
        included: true,
    };
};

export const getSupport = (type: 'limited' | 'priority'): PlanCardFeatureDefinition => {
    return {
        featureName:
            type === 'limited'
                ? c('new_plans: feature').t`Limited support`
                : c('new_plans: feature').t`Priority support`,
        tooltip: '',
        included: true,
        icon: 'life-ring',
    };
};

const getEasySwitch = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Easy Switch import assistant`,
        tooltip: c('new_plans: tooltip').t`Quickly transfer your emails, calendars or contacts from any provider`,
        included: true,
    };
};

export const getHighlightFeatures = (plansMap: PlansMap): PlanCardFeature[] => {
    return [
        getUsers(),
        getStorage(plansMap),
        {
            name: 'support',
            plans: {
                [PLANS.FREE]: getSupport('limited'),
                [PLANS.BUNDLE]: getSupport('priority'),
                [PLANS.MAIL]: getSupport('priority'),
                [PLANS.VPN]: getSupport('priority'),
                [PLANS.DRIVE]: getSupport('priority'),
                [PLANS.FAMILY]: getSupport('priority'),
                [PLANS.MAIL_PRO]: getSupport('priority'),
                [PLANS.BUNDLE_PRO]: getSupport('priority'),
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
                [PLANS.FAMILY]: getEasySwitch(),
                [PLANS.MAIL_PRO]: getEasySwitch(),
                [PLANS.BUNDLE_PRO]: getEasySwitch(),
            },
        },
    ];
};
