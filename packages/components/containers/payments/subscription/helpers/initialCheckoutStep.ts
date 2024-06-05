import { PlanIDs } from '@proton/shared/lib/interfaces';

import { SUBSCRIPTION_STEPS } from '../constants';

export function getInitialCheckoutStep(planIDs: PlanIDs, stepOverride?: SUBSCRIPTION_STEPS): SUBSCRIPTION_STEPS {
    return stepOverride ?? SUBSCRIPTION_STEPS.PLAN_SELECTION;
}
