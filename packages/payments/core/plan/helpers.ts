import { type Plan, PlanState } from '@proton/shared/lib/interfaces';

export function isPlanEnabled(plan: Plan): boolean {
    return plan.State === PlanState.Available;
}
