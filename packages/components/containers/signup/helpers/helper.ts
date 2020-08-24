import { APP_NAMES, APPS, APPS_CONFIGURATION } from 'proton-shared/lib/constants';

import { PlanIDs } from '../interfaces';

export const hasPaidPlan = (planIDs: PlanIDs = {}) => !!Object.keys(planIDs).length;

export const getToAppName = (toApp?: APP_NAMES) => {
    if (!toApp || toApp === APPS.PROTONACCOUNT) {
        return '';
    }
    return APPS_CONFIGURATION[toApp]?.name || '';
};
