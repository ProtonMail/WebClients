import { queryPlans } from '@proton/shared/lib/api/payments';
import type { Plan } from '@proton/shared/lib/interfaces';
import { addApiMock } from '@proton/testing';
import { getTestPlans } from '@proton/testing/data';

export const plansDefaultResponse: { Code: number; Plans: Plan[] } = {
    Code: 1000,
    Plans: getTestPlans(),
};

export function mockPlansApi(plans = plansDefaultResponse) {
    addApiMock(queryPlans({}).url, () => plans);
}
