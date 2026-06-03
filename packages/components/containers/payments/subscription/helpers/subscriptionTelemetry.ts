import isEqual from 'lodash/isEqual';

import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import type { Currency, Cycle, FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
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

export interface SubscriptionTelemetryDeps {
    user: UserModel;
    subscription: Subscription | FreeSubscription;
    model: Model;
    appName: APP_NAMES;
    app: ProductParam;
    context: PaymentTelemetryContext;
}

export const telemetryContext: PaymentTelemetryContext = 'subscription-modification';

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
