import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetrySubscriptionModalEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import { SUBSCRIPTION_STEPS } from './constants';

export const getInitialStep = (step?: SUBSCRIPTION_STEPS) => {
    switch (step) {
        case SUBSCRIPTION_STEPS.PLAN_SELECTION:
            return 'plan_selection';
        case SUBSCRIPTION_STEPS.CHECKOUT:
            return 'checkout';
        default:
            return 'n/a';
    }
};

const useSubscriptionModalTelemetry = () => {
    const api = useApi();
    const reportSubscriptionModalInitialization = ({
        step,
        plan,
        cycle,
        currency,
        upsellRef,
        coupon,
    }: {
        step?: SUBSCRIPTION_STEPS;
        plan?: string;
        cycle: number;
        currency: string;
        upsellRef?: string;
        coupon: string | null | undefined;
    }) => {
        return sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.subscriptionModal,
            event: TelemetrySubscriptionModalEvents.initialization,
            dimensions: {
                initial_step: getInitialStep(step),
                plan_selected: plan,
                billing_cycle: cycle.toString(),
                currency: currency,
                upsell_reference: upsellRef,
                coupon_code: coupon || undefined,
            },
        });
    };

    const reportSubscriptionModalPayment = ({
        cycle,
        currency,
        plan,
        coupon,
    }: {
        cycle: number;
        currency: string;
        plan: string;
        coupon: string | null | undefined;
    }) => {
        return sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.subscriptionModal,
            event: TelemetrySubscriptionModalEvents.payment,
            dimensions: {
                billing_cycle: cycle.toString(),
                currency: currency,
                plan_selected: plan,
                coupon_code: coupon || undefined,
            },
        });
    };

    return {
        reportSubscriptionModalInitialization,
        reportSubscriptionModalPayment,
    };
};

export default useSubscriptionModalTelemetry;
