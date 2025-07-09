import { c } from 'ttag';

import { PLANS, PLAN_NAMES } from '@proton/payments';

export const getExploreText = (target: string) => {
    return c('Action').t`Explore ${target}`;
};

export const getFreeTitle = (appName: string) => {
    return `${appName} ${PLAN_NAMES[PLANS.FREE]}`;
};
