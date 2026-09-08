import type { BillingAddress } from '../core/billing-address/billing-address';
import type { PLANS } from '../core/constants';
import type {
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodType,
    PlainPaymentMethodType,
    PlanIDs,
} from '../core/interface';
import { type TelemetryMethodName, getPaymentMethodConfig } from '../core/payment-methods/registry';
import { getPlanNameFromIDs } from '../core/plan/helpers';
import { getPlanIDs } from '../core/subscription/helpers/plan-ids';
import type { Subscription } from '../core/subscription/interface';
import { isFreeSubscription, isSavedPaymentMethod } from '../core/type-guards';

/**
 * Safely gets plan name from PlanIDs, returning null if planIDs is undefined or invalid.
 */
function safeGetPlanNameFromIDs(planIDs: PlanIDs | null | undefined): PLANS | null {
    if (!planIDs || typeof planIDs !== 'object') {
        return null;
    }
    return getPlanNameFromIDs(planIDs) ?? null;
}

/**
 * Extracts telemetry-relevant properties from user and subscription data.
 *
 * These "current*" properties represent the user's existing subscription state
 * before any modifications. They're used to compare against "selected*" properties
 * in telemetry events.
 *
 * @param userCurrency - The currency from the User object. Undefined means there is no User object
 *                       at all, so no "current*" property is applicable and every one of them is null.
 * @param subscription - The user's current subscription, or undefined/FreeSubscription for free users
 *
 * @returns Object containing:
 * - `currentCurrency`: Currency of existing subscription, or user's default currency
 * - `currentPlanIDs`: PlanIDs object of current subscription, null for free users
 * - `currentCycle`: Billing cycle in months, null for free users
 * - `currentCoupon`: Active coupon code, null if none
 *
 * @example
 * // Paid user whose Mail Plus annual subscription is billed in EUR: the subscription currency wins
 * extractPropertiesFromUserAndSubscription('USD', eurMailPlusAnnualSubscription)
 * // Returns: { currentCurrency: 'EUR', currentPlanIDs: { mail2022: 1 }, currentCycle: 12,
 * //            currentCoupon: null, currentPlanName: 'mail2022' }
 *
 * @example
 * // Free user: no subscription to read, so the User currency is the fallback
 * extractPropertiesFromUserAndSubscription('USD', undefined)
 * // Returns: { currentCurrency: 'USD', currentPlanIDs: null, currentCycle: null,
 * //            currentCoupon: null, currentPlanName: null }
 */
function extractPropertiesFromUserAndSubscription(
    userCurrency: Currency | undefined,
    subscription: Subscription | FreeSubscription | undefined
): {
    currentCurrency: Currency | null;
    currentPlanIDs: PlanIDs | null;
    currentCycle: Cycle | null;
    currentCoupon: string | null;
    currentPlanName: PLANS | null;
} {
    // An absent userCurrency means there is no User object, so there is no existing account state
    // to describe. Every "current*" property is inapplicable rather than merely unknown.
    if (!userCurrency) {
        return {
            currentCurrency: null,
            currentPlanIDs: null,
            currentCycle: null,
            currentCoupon: null,
            currentPlanName: null,
        };
    }

    const currentCurrency: Currency =
        subscription && !isFreeSubscription(subscription) ? subscription.Currency : userCurrency;
    const currentPlanIDs: PlanIDs | null =
        subscription && !isFreeSubscription(subscription) ? getPlanIDs(subscription) : null;
    const currentPlanName = safeGetPlanNameFromIDs(currentPlanIDs);
    const currentCycle: Cycle | null = subscription && !isFreeSubscription(subscription) ? subscription.Cycle : null;

    // make sure to map undefined and empty strings to null
    const currentCoupon: string | null = subscription?.CouponCode || null;

    return { currentCurrency, currentPlanIDs, currentCycle, currentCoupon, currentPlanName };
}

export function formatPaymentTelemetryPayload(
    userCurrency: Currency | undefined,
    subscription: Subscription | FreeSubscription | undefined,
    selectedPlanIDs: PlanIDs | undefined
): ReturnType<typeof extractPropertiesFromUserAndSubscription> & {
    selectedPlanIDs: PlanIDs | undefined;
    selectedPlanName: PLANS | null;
} {
    const extractedProps = extractPropertiesFromUserAndSubscription(userCurrency, subscription);
    return {
        ...extractedProps,
        selectedPlanIDs,
        selectedPlanName: safeGetPlanNameFromIDs(selectedPlanIDs),
    };
}

/**
 * Telemetry representation of a saved payment method.
 * Format: `saved_{original_method}`
 *
 * When adding a new payment method, set its `telemetryName` in the payment method registry and
 * notify the data team about the new value.
 */
type SavedPaymentMethods = `saved_${TelemetryMethodName}`;

/**
 * All possible payment method values for telemetry.
 */
type TelemetryPaymentMethod = TelemetryMethodName | SavedPaymentMethods;

/**
 * Converts internal payment method types to telemetry-friendly format.
 *
 * Handles both new and saved payment methods:
 * - New card → `'card'`
 * - Saved card → `'saved_card'`
 *
 * @param paymentMethodType - The plain payment method type (e.g., 'chargebee-card', 'chargebee-paypal')
 * @param paymentMethodValue - The full payment method value, used to detect if it's a saved method
 *
 * @returns Telemetry payment method string, or null if inputs are undefined
 *
 * @example
 * // New card payment
 * getTelemetryPaymentMethod({ paymentMethodType: 'chargebee-card', paymentMethodValue: 'chargebee-card' })
 * // Returns: 'card'
 *
 * @example
 * // Saved card payment
 * getTelemetryPaymentMethod({ paymentMethodType: 'chargebee-card', paymentMethodValue: savedPaymentMethodID })
 * // Returns: 'saved_card'
 */
export function getTelemetryPaymentMethod({
    paymentMethodType,
    paymentMethodValue,
}: {
    paymentMethodType: PlainPaymentMethodType | undefined;
    paymentMethodValue: PaymentMethodType | undefined;
}): TelemetryPaymentMethod | null {
    if (!paymentMethodType || !paymentMethodValue) {
        return null;
    }

    const plainTelemetryPaymentMethod = getPaymentMethodConfig(paymentMethodType)?.telemetryName;

    if (!plainTelemetryPaymentMethod) {
        return null;
    }

    if (isSavedPaymentMethod(paymentMethodValue)) {
        return `saved_${plainTelemetryPaymentMethod}`;
    }

    return plainTelemetryPaymentMethod;
}

/**
 * Checkout step in the subscription modification flow.
 *
 * - `'plan_selection'` - User is viewing/selecting plans
 * - `'checkout'` - User is on the payment/checkout screen
 */
export type SubscriptionModificationStepTelemetry = 'plan_selection' | 'checkout';

/**
 * Context identifier for telemetry events.
 *
 * The context determines the event name prefix and helps identify where
 * in the application the event was triggered.
 *
 * When adding a new checkout flow:
 * 1. Add a new context value here
 * 2. Update `getMapping()` in shared-checkout-telemetry.ts
 * 3. Update documentation
 * 4. Notify the data team about the new context
 */
export type PaymentTelemetryContext =
    /** V1 signup flow */
    | 'v1-signup'
    /** V2 signup flow - initial signup */
    | 'v2-signup'
    /** V2 signup flow - plan modification step */
    | 'v2-signup-modification'
    /** Context-based Drive signup */
    | 'ctx-signup-drive'
    /** Context-based Pass signup */
    | 'ctx-signup-pass'
    /** Context-based generic signup */
    | 'ctx-signup-generic'
    /** Context-based Greenland signup */
    | 'ctx-signup-greenland'
    /** Context-based Meet signup */
    | 'ctx-signup-meet'
    /** Context-based Meet B2C plan signup */
    | 'ctx-signup-meet-b2c-plan'
    /** Context-based Mail signup */
    | 'ctx-signup-mail'
    /** Context-based referral signup */
    | 'ctx-signup-referral'
    /** Context-based email reservation */
    | 'ctx-email-reservation'
    /** Subscription modification modal for existing users */
    | 'subscription-modification'
    /** Legacy Upgrade settings page at /{product}/upgrade */
    | 'settings-upgrade'
    /** New account Home page / dashboard with the upsell section above the fold */
    | 'account-home'
    /** Fallback for unmapped contexts */
    | 'other';

/**
 * The billing address facts reported by the initialization event.
 *
 * These describe what the user is shown in the billing address element when checkout opens, so they
 * follow whatever the flow has already normalized or defaulted, not the raw API response.
 */
export type InitialBillingAddressTelemetryProperties = {
    /** Country code shown initially, or null if the address has none */
    initialCountry: string | null;
    /** State shown initially, or null if the country has no states or none is set yet */
    initialState: string | null;
    /** Whether a zip code is shown initially. */
    initialHasZipCode: boolean;
};

/**
 * Reduces a billing address to the facts we are allowed to report.
 *
 * The address itself must never reach telemetry: depending on the flow it can carry the customer's
 * name, street, city, company and zip code. Only the country, the state, and whether a zip code
 * exists are returned, and the return type is pinned to those three fields so nothing else can be
 * added here by accident.
 */
export function getInitialBillingAddressProperties(
    billingAddress: BillingAddress
): InitialBillingAddressTelemetryProperties {
    // make sure to map undefined and empty strings to null
    return {
        initialCountry: billingAddress.CountryCode || null,
        initialState: billingAddress.State || null,
        initialHasZipCode: !!billingAddress.ZipCode,
    };
}
