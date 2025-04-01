import { PlanState } from './constants';
import { type Plan } from './interface';

export function isPlanEnabled(plan: Plan): boolean {
    return plan.State === PlanState.Available;
}
