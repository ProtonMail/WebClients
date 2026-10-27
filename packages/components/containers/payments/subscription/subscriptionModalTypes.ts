import type { TelemetryPaymentFlow } from '@proton/payments-ui/client-extensions/usePaymentsTelemetry';
import type { ADDON_PREFIXES, PLANS } from '@proton/payments/core/constants';
import type { Currency, Cycle, PlanIDs } from '@proton/payments/core/interface';
import type { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import type { UpsellTelemetryContext } from '@proton/payments/telemetry/shared-checkout-telemetry';
import type { Audience } from '@proton/shared/lib/payments/subscription/constants';

import type { SelectedProductPlans } from './helpers/payment';

export type SubscriptionOverridableStep = SUBSCRIPTION_STEPS.UPGRADE | SUBSCRIPTION_STEPS.THANKS;

export interface OpenCallbackProps {
    step?: SUBSCRIPTION_STEPS;
    cycle?: Cycle;
    currency?: Currency;
    plan?: PLANS;
    planIDs?: PlanIDs;
    coupon?: string | null;
    disablePlanSelection?: boolean;
    disableThanksStep?: boolean;
    defaultAudience?: Audience;
    disableCycleSelector?: boolean;
    defaultSelectedProductPlans?: SelectedProductPlans;
    telemetryFlow?: TelemetryPaymentFlow;
    upsellRef?: string;
    maximumCycle?: Cycle;
    minimumCycle?: Cycle;
    onSubscribed?: () => void;
    onUnsubscribed?: () => void;
    mode?: 'upsell-modal';
    allowedAddonTypes?: ADDON_PREFIXES[];
    hasClose?: boolean;
    onClose?: () => void;
    onMount?: () => void;
    disableCloseOnEscape?: boolean;
    fullscreen?: boolean;
    upsellTelemetryContext?: UpsellTelemetryContext;
}
