import isEqual from 'lodash/isEqual';

import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import type { WebPaymentsSubscriptionStepsTotal } from '@proton/metrics/types/web_payments_subscription_steps_total_v1.schema';
import type { Currency, Cycle, FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import type {
    PaymentTelemetryContext,
    SubscriptionModificationStepTelemetry,
} from '@proton/payments/telemetry/helpers';
import type { EstimationChangePayload } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { RequireOnly, UserModel } from '@proton/shared/lib/interfaces';

import type { Model } from '../SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from '../constants';

export type SubscriptionCheckoutMetricsUpgradeFromPlan = WebPaymentsSubscriptionStepsTotal['Labels']['fromPlan'];
export type SubscriptionCheckoutMetricsStep = WebPaymentsSubscriptionStepsTotal['Labels']['step'];
export interface SubscriptionCheckoutMetricsOverrides {
    source: WebPaymentsSubscriptionStepsTotal['Labels']['source'];
}

export interface SubscriptionMetricsProps {
    source: SubscriptionCheckoutMetricsOverrides['source'];
    step: SubscriptionCheckoutMetricsStep;
    fromPlan: SubscriptionCheckoutMetricsUpgradeFromPlan;
    application: 'proton-account' | 'proton-account-lite' | 'proton-vpn-settings';
}

export interface SubscriptionTelemetryDeps {
    user: UserModel;
    subscription: Subscription | FreeSubscription;
    model: Model;
    appName: APP_NAMES;
    app: ProductParam;
    context: PaymentTelemetryContext;
}

export const telemetryContext: PaymentTelemetryContext = 'subscription-modification';

const metricStepMap: Record<SUBSCRIPTION_STEPS, SubscriptionCheckoutMetricsStep> = {
    [SUBSCRIPTION_STEPS.NETWORK_ERROR]: 'network-error',
    [SUBSCRIPTION_STEPS.PLAN_SELECTION]: 'plan-selection',
    [SUBSCRIPTION_STEPS.CHECKOUT]: 'checkout',
    [SUBSCRIPTION_STEPS.UPGRADE]: 'upgrade',
    [SUBSCRIPTION_STEPS.THANKS]: 'thanks',
};

export const getMetricsProps = (
    outerMetricsProps: SubscriptionCheckoutMetricsOverrides,
    step: SUBSCRIPTION_STEPS,
    subscription: MaybeFreeSubscription,
    application: 'proton-account' | 'proton-account-lite' | 'proton-vpn-settings'
): SubscriptionMetricsProps => ({
    ...outerMetricsProps,
    step: metricStepMap[step],
    fromPlan: isFreeSubscription(subscription) ? 'free' : ('paid' as SubscriptionCheckoutMetricsUpgradeFromPlan),
    application,
});

export const getCommonTelemetryPayload = (
    telemetryDeps: SubscriptionTelemetryDeps
): {
    userCurrency: Currency;
    subscription: Subscription | FreeSubscription;
    selectedCycle: Cycle;
    selectedPlanIDs: PlanIDs;
    selectedCurrency: Currency;
    selectedCoupon: string | null | undefined;
    selectedStep: SubscriptionModificationStepTelemetry;
    build: APP_NAMES;
    product: ProductParam;
    context: PaymentTelemetryContext;
} => {
    const { user, subscription, model, appName, app, context } = telemetryDeps;
    return {
        userCurrency: user.Currency,
        subscription,
        selectedCycle: model.cycle,
        selectedPlanIDs: model.planIDs,
        selectedCurrency: model.currency,
        selectedCoupon: model.coupon,
        selectedStep: model.step === SUBSCRIPTION_STEPS.PLAN_SELECTION ? 'plan_selection' : 'checkout',
        build: appName,
        product: app,
        context,
    };
};

export const reportChangeTelemetry = (
    paymentFacade: PaymentFacade,
    telemetryDeps: SubscriptionTelemetryDeps,
    { action, ...overrides }: RequireOnly<EstimationChangePayload, 'action'>
) => {
    const nonEmptyOverrides = Object.fromEntries(Object.entries(overrides).filter(([_, value]) => value !== undefined));
    const payload: EstimationChangePayload = {
        action,
        ...getCommonTelemetryPayload(telemetryDeps),
        paymentMethodType: paymentFacade.selectedMethodType,
        paymentMethodValue: paymentFacade.selectedMethodValue,
        ...nonEmptyOverrides,
    };

    checkoutTelemetry.reportSubscriptionEstimationChange(payload);
};

export const reportPlanIDsIfChangedTelemetry = (
    newlySelectedPlanIDs: PlanIDs,
    paymentFacade: PaymentFacade,
    telemetryDeps: SubscriptionTelemetryDeps
) => {
    const currentlySelectedPlanIDs = telemetryDeps.model.planIDs;
    if (isEqual(newlySelectedPlanIDs, currentlySelectedPlanIDs)) {
        return;
    }

    const currentlySelectedPlanName = getPlanNameFromIDs(currentlySelectedPlanIDs);
    const newlySelectedPlanName = getPlanNameFromIDs(newlySelectedPlanIDs);
    const action = currentlySelectedPlanName === newlySelectedPlanName ? 'addon_changed' : 'plan_changed';
    reportChangeTelemetry(paymentFacade, telemetryDeps, {
        action,
        selectedPlanIDs: newlySelectedPlanIDs,
    });
};
