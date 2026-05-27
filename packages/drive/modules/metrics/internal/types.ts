export enum MetricUserPlan {
    Paid = 'paid',
    Free = 'free',
    Anonymous = 'anonymous',
    Unknown = 'unknown',
}

export interface MetricUserPlanProvider {
    getUserPlan(): MetricUserPlan;
}
