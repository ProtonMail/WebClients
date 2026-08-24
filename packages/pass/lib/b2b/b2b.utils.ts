import { PLANS } from '@proton/payments/core/constants';

import type { PassPlanResponse } from '../../types';
import { PlanType } from '../../types';
import type { B2BEvent, B2BEventName } from '../../types/data/b2b';

export const isB2BEvent =
    <T extends B2BEventName>(name: T) =>
    (event: B2BEvent): event is B2BEvent<T> =>
        event.name === name;

/** Pass Essentials is currently considered as Plus and not B2B. */
export const isPassB2BPlan = (plan: PassPlanResponse) =>
    plan.Type === PlanType.BUSINESS || plan.InternalName === PLANS.PASS_PRO;
