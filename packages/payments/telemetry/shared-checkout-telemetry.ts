/**
 * Shared Checkout Telemetry
 *
 * This module provides telemetry reporting functions for payment/checkout flows.
 * Events are sent to Proton Analytics and follow a context-based naming convention.
 *
 * Event naming: `{context}_{event_type}` (e.g., `v2_signup_payment`, `subscription_modification_init`)
 *
 * @see confluence.md for complete event documentation for data analysts
 * @see README.internal.md for frontend developer integration guide
 */
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { telemetry } from '@proton/shared/lib/telemetry';

import type {
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodType,
    PlainPaymentMethodType,
    PlanIDs,
} from '../core/interface';
import type { Subscription } from '../core/subscription/interface';
import {
    type PaymentTelemetryContext,
    type SubscriptionModificationStepTelemetry,
    formatPaymentTelemetryPayload,
    getTelemetryPaymentMethod,
} from './helpers';

/**
 * Generates event name mapping for all contexts.
 *
 * @param suffix - The event type suffix (e.g., 'init', 'payment', 'estimation_change')
 * @returns Record mapping each context to its full event name
 *
 * @example
 * getMapping('init')
 * // Returns: { 'v1-signup': 'v1_signup_init', 'subscription-modification': 'subscription_modification_init', ... }
 */
function getMapping(suffix: string): Record<PaymentTelemetryContext, string> {
    return {
        'v1-signup': `v1_signup_${suffix}`,
        'v2-signup': `v2_signup_${suffix}`,
        'v2-signup-modification': `v2_signup_modification_${suffix}`,
        'ctx-signup-drive': `ctx_signup_drive_${suffix}`,
        'ctx-signup-pass': `ctx_signup_pass_${suffix}`,
        'ctx-signup-generic': `ctx_signup_generic_${suffix}`,
        'ctx-signup-greenland': `ctx_signup_greenland_${suffix}`,
        'ctx-signup-meet': `ctx_signup_meet_${suffix}`,
        'ctx-signup-referral': `ctx_signup_referral_${suffix}`,
        'subscription-modification': `subscription_modification_${suffix}`,
        other: `other_${suffix}`,
    } as const satisfies Record<PaymentTelemetryContext, string>;
}

// ============================================================================
// #region reportAddLumo
// ============================================================================

/** Event name mapping for Add Lumo events */
export const ADD_LUMO_CONTEXT_MAPPING = getMapping('add_lumo');

/**
 * Reports when user interacts with the "Add Lumo" button for the first time.
 *
 * **When to call:** First time user clicks/interacts with Add Lumo button in a session.
 * **Purpose:** Track interest in the Lumo addon.
 *
 * @param context - The checkout context where the interaction occurred
 *
 * @example
 * reportAddLumo({ context: 'subscription-modification' });
 * // Sends: subscription_modification_add_lumo
 */
export function reportAddLumo({ context }: { context: PaymentTelemetryContext }) {
    const eventName = ADD_LUMO_CONTEXT_MAPPING[context] ?? 'unknown_context_add_lumo';
    telemetry.sendCustomEvent(eventName);
}
// #endregion

// ============================================================================
// #region reportPayment
// ============================================================================

/**
 * Payment process stages for funnel analysis.
 *
 * Events are sent at each stage to track where users drop off:
 *
 * - `attempt` - User clicked "Pay" button
 * - `attempt_declined_invalid_data` - Frontend validation failed
 * - `verification_required` - 3DS or similar verification requested
 * - `verification_attempted_by_user` - User agreed to open verification
 * - `verification_rejected_by_user` - User cancelled verification
 * - `verification_success` - Verification passed (may be sent even without verification)
 * - `verification_failure` - Verification failed
 * - `payment_declined` - Payment processor rejected the charge
 * - `payment_success` - Payment successful, subscription modified
 *
 * @see confluence.md for detailed stage descriptions
 */
export type PaymentStage =
    | 'attempt'
    | 'attempt_declined_invalid_data'
    | 'verification_required'
    | 'verification_attempted_by_user'
    | 'verification_rejected_by_user'
    | 'verification_success'
    | 'verification_failure'
    | 'billing_address_failure'
    | 'payment_declined'
    | 'payment_success';

type BillingAddressFailureAdditionalProps = {
    /** Billing address country code */
    CountryCode?: string;
    /** Billing address state */
    State?: string | null;
    /** Whether the billing address has a zip code */
    hasZipCode?: boolean;
};

/**
 * Payload for payment telemetry events.
 */
export type PaymentTelemetryPayload = {
    /** Current payment process stage */
    stage: PaymentStage;
    /** User's default currency (from User object) */
    userCurrency: Currency | undefined;
    /** User's current subscription (undefined or FreeSubscription for free users) */
    subscription?: Subscription | FreeSubscription;
    /** Final amount due in smallest currency unit (cents). Includes proration, credits, discounts. */
    amount: number;
    /** Internal payment method type */
    paymentMethodType: PlainPaymentMethodType | undefined;
    /** Full payment method value (used to detect saved methods) */
    paymentMethodValue: PaymentMethodType | undefined;
    /** Currency being charged */
    selectedCurrency: Currency;
    /** Plan and addons being purchased */
    selectedPlanIDs: PlanIDs;
    /** Billing cycle being purchased */
    selectedCycle: Cycle;
    /** Applied coupon code */
    selectedCoupon: string | null | undefined;
    /** Application build name (e.g., 'proton-account') */
    build: APP_NAMES;
    /** Product context within the app */
    product: ProductParam;
    /** Checkout context for event naming */
    context: PaymentTelemetryContext;
} & BillingAddressFailureAdditionalProps;

/** Event name mapping for payment events */
export const PAYMENT_CONTEXT_MAPPING = getMapping('payment');

/**
 * Reports payment funnel events.
 *
 * **When to call:** At each significant stage of the payment process.
 * Call multiple times with different `stage` values as user progresses.
 *
 * **Purpose:** Track payment conversion funnel. Analyze where users drop off.
 *
 * @param payload - Payment event data including stage, amount, and subscription details
 *
 * @example
 * // When user clicks Pay button
 * reportPayment({ stage: 'attempt', amount: 4999, ... });
 *
 * // When 3DS is required
 * reportPayment({ stage: 'verification_required', ... });
 *
 * // When payment succeeds
 * reportPayment({ stage: 'payment_success', ... });
 */
export function reportPayment({
    context,
    userCurrency,
    subscription,
    selectedCoupon,
    paymentMethodType,
    paymentMethodValue,
    selectedPlanIDs,
    ...rest
}: PaymentTelemetryPayload) {
    const method = getTelemetryPaymentMethod({ paymentMethodType, paymentMethodValue });

    const eventName = PAYMENT_CONTEXT_MAPPING[context] ?? 'unknown_context_payment';
    telemetry.sendCustomEvent(eventName, {
        selectedCoupon: selectedCoupon ? selectedCoupon : null,
        method,
        ...formatPaymentTelemetryPayload(userCurrency, subscription, selectedPlanIDs),
        ...rest,
    });
}
// #endregion

// ============================================================================
// #region reportBillingCountryChange
// ============================================================================

/**
 * Payload for billing country/state change events.
 */
export type ChangeBillingCountryTelemetryPayload = {
    /** Checkout context for event naming */
    context: PaymentTelemetryContext;
    /** Country code before change (ISO 3166-1 alpha-2) */
    currentCountry: string;
    /** Country code after change */
    selectedCountry: string;
    /** State/province before change (relevant for US, Canada, India) */
    currentState: string | null;
    /** State/province after change */
    selectedState: string | null;
    /** What was changed: country or state */
    action: 'change_country' | 'change_state';
};

/** Event name mapping for billing country change events */
export const CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING = getMapping('change_billing_country');

/**
 * Reports when user changes billing country or state.
 *
 * **When to call:** When billing country or state input changes.
 * **Purpose:** Track geographic distribution and tax-related user behavior.
 *
 * @param payload - Country/state change details
 *
 * @example
 * reportBillingCountryChange({
 *   context: 'subscription-modification',
 *   action: 'change_country',
 *   currentCountry: 'US',
 *   selectedCountry: 'DE',
 *   currentState: 'CA',
 *   selectedState: null
 * });
 */
export function reportBillingCountryChange({ context, ...rest }: ChangeBillingCountryTelemetryPayload) {
    const eventName = CHANGE_BILLING_COUNTRY_CONTEXT_MAPPING[context] ?? 'unknown_context_change_billing_country';
    telemetry.sendCustomEvent(eventName, rest);
}
// #endregion

// ============================================================================
// #region reportEstimationParametersChange
// ============================================================================

/**
 * Actions that trigger estimation change events.
 *
 * Each action represents a specific user interaction:
 * - `currency_changed` - User changed currency
 * - `plan_changed` - User selected different plan
 * - `addon_changed` - User added/removed addon
 * - `cycle_changed` - User changed billing cycle
 * - `coupon_changed` - User applied/removed coupon
 * - `payment_method_changed` - User selected different payment method
 */
export type EstimationChangeAction =
    | 'currency_changed'
    | 'plan_changed'
    | 'addon_changed'
    | 'cycle_changed'
    | 'coupon_changed'
    | 'payment_method_changed';

/**
 * Payload for subscription estimation change events.
 */
export type EstimationChangePayload = {
    /** Checkout context for event naming */
    context: PaymentTelemetryContext;
    /** User's default currency */
    userCurrency: Currency | undefined;
    /** User's current subscription */
    subscription: Subscription | FreeSubscription | undefined;
    /** Plans selected after change */
    selectedPlanIDs: PlanIDs;
    /** Currency after change */
    selectedCurrency: Currency;
    /** Billing cycle after change */
    selectedCycle: Cycle;
    /** Coupon after change */
    selectedCoupon: string | null | undefined;
    /** Internal payment method type */
    paymentMethodType: PlainPaymentMethodType | undefined;
    /** Full payment method value */
    paymentMethodValue: PaymentMethodType | undefined;
    /** What triggered this event */
    action: EstimationChangeAction;
    /** Application build name */
    build: APP_NAMES;
    /** Product context */
    product: ProductParam;
};

/** Event name mapping for estimation change events */
export const ESTIMATION_PARAMETERS_CHANGE_CONTEXT_MAPPING = getMapping('estimation_change');

/**
 * Reports when user modifies subscription parameters.
 *
 * **When to call:** Each time user changes plan, cycle, currency, coupon, addon, or payment method.
 *
 * **Purpose:** Track user exploration of checkout options. Understand what options
 * users consider before converting (or abandoning).
 *
 * **Required actions to implement:**
 * - `currency_changed`
 * - `plan_changed`
 * - `addon_changed`
 * - `cycle_changed`
 * - `coupon_changed`
 *
 * @param payload - Change event details including action and new values
 *
 * @example
 * // User changed from monthly to yearly
 * reportSubscriptionEstimationChange({
 *   context: 'v2-signup',
 *   action: 'cycle_changed',
 *   selectedCycle: 12,
 *   ...otherProps
 * });
 */
export function reportSubscriptionEstimationChange({
    context,
    subscription,
    userCurrency,
    selectedCoupon,
    paymentMethodType,
    paymentMethodValue,
    selectedPlanIDs,
    ...rest
}: EstimationChangePayload) {
    const method = getTelemetryPaymentMethod({ paymentMethodType, paymentMethodValue });
    const eventName = ESTIMATION_PARAMETERS_CHANGE_CONTEXT_MAPPING[context] ?? 'unknown_context_change';
    const payload = {
        method,
        selectedCoupon: selectedCoupon ? selectedCoupon : null,
        ...formatPaymentTelemetryPayload(userCurrency, subscription, selectedPlanIDs),
        ...rest,
    };

    telemetry.sendCustomEvent(eventName, payload);
}
// #endregion

// ============================================================================
// #region reportInitialization
// ============================================================================

/**
 * Payload for checkout initialization events.
 */
type PaymentInitTelemetryPayload = {
    /** User's default currency */
    userCurrency: Currency | undefined;
    /** User's current subscription */
    subscription: Subscription | FreeSubscription | undefined;
    /** Currency displayed in checkout */
    selectedCurrency: Currency;
    /** Plans displayed/pre-selected in checkout */
    selectedPlanIDs: PlanIDs;
    /** Billing cycle displayed/pre-selected */
    selectedCycle: Cycle;
    /** Pre-applied coupon */
    selectedCoupon: string | null | undefined;
    /** Current checkout step (for multi-step flows) */
    selectedStep: SubscriptionModificationStepTelemetry | null;
    /** Application build name */
    build: APP_NAMES;
    /** Product context */
    product: ProductParam;
    /** Checkout context for event naming */
    context: PaymentTelemetryContext;
};

/** Event name mapping for initialization events */
export const INITIALIZATION_CONTEXT_MAPPING = getMapping('init');

/**
 * Reports checkout/payment component initialization.
 *
 * **When to call:** Once when checkout component first renders.
 * Do NOT call on subsequent re-renders.
 *
 * **Purpose:** Track how many users enter the checkout flow.
 * Compare against payment_success to calculate conversion rate.
 *
 * @param payload - Initial checkout state
 *
 * @example
 * // In useEffect with empty dependency array
 * useEffect(() => {
 *   reportInitialization({
 *     context: 'subscription-modification',
 *     selectedStep: 'plan_selection',
 *     ...otherProps
 *   });
 * }, []);
 */
export function reportInitialization({
    userCurrency,
    subscription,
    selectedPlanIDs,
    context,
    ...rest
}: PaymentInitTelemetryPayload) {
    const eventName = INITIALIZATION_CONTEXT_MAPPING[context] ?? 'unknown_context_init';
    telemetry.sendCustomEvent(eventName, {
        ...formatPaymentTelemetryPayload(userCurrency, subscription, selectedPlanIDs),
        ...rest,
    });
}
// #endregion
