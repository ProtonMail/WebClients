import type { Plan } from '@proton/payments';
import { queryPlans } from '@proton/payments/core/api/api';
import { addApiMock } from '@proton/testing';
import { getLongTestPlans } from '@proton/testing/data';

export const plansDefaultResponse: { Code: number; Plans: Plan[] } = {
    Code: 1000,
    Plans: getLongTestPlans(),
};

export function mockPlansApi(plans = plansDefaultResponse) {
    addApiMock(queryPlans({}).url, () => plans);
}
