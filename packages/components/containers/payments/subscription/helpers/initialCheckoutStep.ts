import type { PlanIDs } from '@proton/payments/core/interface';

import { SUBSCRIPTION_STEPS } from '../constants';

export function getInitialCheckoutStep(planIDs: PlanIDs, stepOverride?: SUBSCRIPTION_STEPS): SUBSCRIPTION_STEPS {
    return stepOverride ?? SUBSCRIPTION_STEPS.PLAN_SELECTION;
}
