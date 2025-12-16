/**
 * Payment Telemetry API
 *
 * Central export for all payment telemetry functions.
 *
 * @example
 * import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
 *
 * // Initialization
 * checkoutTelemetry.reportInitialization({ ... });
 *
 * // User changes
 * checkoutTelemetry.reportSubscriptionEstimationChange({ ... });
 *
 * // Payment funnel
 * checkoutTelemetry.reportPayment({ ... });
 *
 * // Subscription modal specific
 * checkoutTelemetry.subscriptionContainer.reportChangeStep({ ... });
 *
 * @see confluence.md - Complete event documentation for data analysts
 * @see README.internal.md - Integration guide for developers
 */
import {
    reportAddLumo,
    reportBillingCountryChange,
    reportInitialization,
    reportPayment,
    reportSubscriptionEstimationChange,
} from './shared-checkout-telemetry';
import {
    reportAudienceChange,
    reportChangeStep,
    reportClosedByUser,
    reportPlanDescriptionInteraction,
} from './subscription-container';

/**
 * Checkout telemetry API.
 *
 * Contains all telemetry reporting functions organized by scope:
 * - Top-level functions: Used across all checkout flows
 * - `subscriptionContainer`: Events specific to subscription modification modal
 */
export const checkoutTelemetry = {
    /** Report checkout component initialization. Call once on mount. */
    reportInitialization,
    /** Report subscription parameter changes (plan, cycle, currency, etc.) */
    reportSubscriptionEstimationChange,
    /** Report billing country/state changes */
    reportBillingCountryChange,
    /** Report Add Lumo button interaction (first time only) */
    reportAddLumo,
    /** Report payment funnel events (attempt, verification, success, etc.) */
    reportPayment,

    /**
     * Events specific to the subscription modification modal.
     * Only use these in the subscription modification flow.
     */
    subscriptionContainer: {
        /** Report audience tab clicks (b2c/family/b2b) */
        reportAudienceChange,
        /** Report plan description expand/collapse */
        reportPlanDescriptionInteraction,
        /** Report modal close by user (not after success) */
        reportClosedByUser,
        /** Report step navigation (plan_selection ↔ checkout) */
        reportChangeStep,
    },
};
