import { c } from 'ttag';
import { PLANS } from '@proton/shared/lib/constants';
import { PlansMap } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';
import { getStorage } from './drive';

export const getSupport = (type: 'limited' | 'priority'): PlanCardFeatureDefinition => {
    return {
        featureName:
            type === 'limited'
                ? c('new_plans: feature').t`Limited support`
                : c('new_plans: feature').t`Priority support`,
        tooltip: '',
        included: true,
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
