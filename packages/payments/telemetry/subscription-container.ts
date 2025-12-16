/**
 * Subscription Container Telemetry
 *
 * Events specific to the subscription modification modal.
 * These events use fixed names (no context prefix) as they're only used
 * in the subscription modification flow for existing users.
 *
 * @see confluence.md for complete event documentation
 */
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { telemetry } from '@proton/shared/lib/telemetry';

import type { SubscriptionModificationStepTelemetry } from './helpers';

/**
 * Reports plan description expand/collapse interactions.
 *
 * **Event Name:** `subscription_modification_plan_description`
 *
 * **When to call:** When user expands or collapses the "What do I get?" plan details section.
 *
 * **Purpose:** Track user interest in plan details. High expand rates may indicate
 * users need more information before purchasing.
 *
 * @param props.action - `'expand'` when section is opened, `'collapse'` when closed
 *
 * @example
 * reportPlanDescriptionInteraction({ action: 'expand' });
 */
export function reportPlanDescriptionInteraction(props: { action: 'expand' | 'collapse' }) {
    telemetry.sendCustomEvent('subscription_modification_plan_description', props);
}

/**
 * Reports when user explicitly closes the subscription modification modal.
 *
 * **Event Name:** `subscription_modification_closed_by_user`
 *
 * **When to call:** When user clicks close button, presses Escape, or clicks outside the modal.
 * Do NOT call when modal closes after successful payment.
 *
 * **Purpose:** Track abandonment. Compare against init events to calculate drop-off rate.
 *
 * @param props.build - Application build name (e.g., 'proton-account', 'proton-mail')
 * @param props.product - Product context within the app
 *
 * @example
 * reportClosedByUser({ build: 'proton-account', product: 'mail' });
 */
export function reportClosedByUser(props: { build: APP_NAMES; product: ProductParam }) {
    telemetry.sendCustomEvent('subscription_modification_closed_by_user', props);
}

/**
 * Reports navigation between checkout steps.
 *
 * **Event Name:** `subscription_modification_change_step`
 *
 * **When to call:** When user navigates from plan selection to checkout or vice versa.
 * Use the `useSubscriptionModificationChangeStepTelemetry` hook for automatic tracking.
 *
 * **Purpose:** Track user progression through the checkout funnel.
 *
 * @param props.step - The step user navigated TO: `'plan_selection'` or `'checkout'`
 * @param props.build - Application build name
 * @param props.product - Product context
 *
 * @example
 * // User clicked "Continue" to go to checkout
 * reportChangeStep({ step: 'checkout', build: 'proton-account', product: 'mail' });
 *
 * // User clicked "Back" to return to plan selection
 * reportChangeStep({ step: 'plan_selection', build: 'proton-account', product: 'mail' });
 */
export function reportChangeStep(props: {
    step: SubscriptionModificationStepTelemetry;
    build: APP_NAMES;
    product: ProductParam;
}) {
    telemetry.sendCustomEvent('subscription_modification_change_step', props);
}

/**
 * Audience segments in plan selection.
 *
 * - `'b2c'` - For individuals (default consumer plans)
 * - `'family'` - For families (family plans)
 * - `'b2b'` - For businesses (business plans)
 */
export type SubscriptionModificationChangeAudienceTelemetry = 'b2c' | 'b2b' | 'family';

/**
 * Reports audience tab selection in plan selection view.
 *
 * **Event Name:** `subscription_modification_change_audience`
 *
 * **When to call:** When user clicks "For individuals", "For families", or "For businesses" tabs.
 *
 * **Purpose:** Track interest in different plan segments. Useful for understanding
 * user intent and product-market fit.
 *
 * @param props.audience - Selected audience segment
 * @param props.build - Application build name
 * @param props.product - Product context
 *
 * @example
 * // User clicked "For families" tab
 * reportAudienceChange({ audience: 'family', build: 'proton-account', product: 'mail' });
 */
export function reportAudienceChange(props: {
    audience: SubscriptionModificationChangeAudienceTelemetry;
    product: ProductParam;
    build: APP_NAMES;
}) {
    telemetry.sendCustomEvent('subscription_modification_change_audience', props);
}
