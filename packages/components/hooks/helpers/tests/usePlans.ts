import { queryPlans } from '@proton/payments/core/api/api';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { addApiMock } from '@proton/test-api/api';

export const plansDefaultResponse: { Code: number; Plans: Plan[] } = {
    Code: 1000,
    Plans: getLongTestPlans(),
};

export function mockPlansApi(plans = plansDefaultResponse) {
    addApiMock(queryPlans({}).url, () => plans);
}
