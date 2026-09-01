import { c } from 'ttag';

import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';

import type { StandardPlanCardFeatureDefinition } from './interface';

export const getPrioritySupport = (): StandardPlanCardFeatureDefinition => {
    return {
        id: 'priority-support',
        text: c('Subscription reminder').t`Priority support`,
        included: true,
        icon: IcLifeRing,
    };
};
