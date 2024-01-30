import { PlanType } from './pass';

export enum UserPassPlan {
    BUSINESS = PlanType.business,
    FREE = PlanType.free,
    PLUS = PlanType.plus,
    TRIAL = 'trial',
}
