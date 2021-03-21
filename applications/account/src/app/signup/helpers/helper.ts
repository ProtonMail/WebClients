import { PlanIDs } from '../interfaces';

export const hasPaidPlan = (planIDs: PlanIDs = {}) => !!Object.keys(planIDs).length;
