import { c } from 'ttag';

import type { StandardPlanCardFeatureDefinition } from './interface';

export const getPrioritySupport = (): StandardPlanCardFeatureDefinition => {
    return {
        text: c('Subscription reminder').t`Priority support`,
        included: true,
        icon: 'life-ring',
    };
};
