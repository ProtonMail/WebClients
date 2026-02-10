import type { WebPaymentsSubscriptionStepsTotal } from '@proton/metrics/types/web_payments_subscription_steps_total_v1.schema';

export interface SubscriptionCheckoutMetricsOverrides {
    source: WebPaymentsSubscriptionStepsTotal['Labels']['source'];
}

export type SubscriptionCheckoutMetricsUpgradeFromPlan = WebPaymentsSubscriptionStepsTotal['Labels']['fromPlan'];
export type SubscriptionCheckoutMetricsStep = WebPaymentsSubscriptionStepsTotal['Labels']['step'];
