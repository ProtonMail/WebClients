import type { Plan } from '../interfaces';

export function isSamePlan(plan1: Plan, plan2: Plan): boolean {
    return plan1.Name === plan2.Name && plan1.Cycle === plan2.Cycle;
}
