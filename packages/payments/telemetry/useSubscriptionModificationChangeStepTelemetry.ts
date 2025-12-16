/**
 * Hook for automatic step change telemetry in subscription modification flow.
 *
 * This hook tracks when users navigate between checkout steps and automatically
 * reports telemetry events. It skips the initial render to avoid false positives.
 *
 * @example
 * ```tsx
 * import { useSubscriptionModificationChangeStepTelemetry } from '@proton/payments/telemetry/useSubscriptionModificationChangeStepTelemetry';
 *
 * const MyComponent = () => {
 *   const [step, setStep] = useState<'plan_selection' | 'checkout'>('plan_selection');
 *
 *   useSubscriptionModificationChangeStepTelemetry({
 *     step,
 *     app: 'mail',
 *   });
 *
 *   return <div>...</div>;
 * };
 * ```
 */
import { useEffect, useRef } from 'react';

import useConfig from '@proton/components/hooks/useConfig';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { SubscriptionModificationStepTelemetry } from './helpers';
import { checkoutTelemetry } from './telemetry';

/**
 * Automatically reports step change events when the step prop changes.
 *
 * **Behavior:**
 * - Skips initial render (doesn't report the first step value)
 * - Reports on subsequent step changes
 * - Does nothing if step is null
 *
 * **When to use:** In subscription modification modal to track user navigation
 * between plan selection and checkout steps.
 *
 * @param step - Current checkout step, or null if not applicable
 * @param app - Product context (mail, drive, etc.)
 */
export const useSubscriptionModificationChangeStepTelemetry = ({
    step,
    app,
}: {
    step: SubscriptionModificationStepTelemetry | null;
    app: ProductParam;
}) => {
    const skippedInitialRendering = useRef(false);
    const { APP_NAME } = useConfig();

    useEffect(() => {
        // Skip initial render - we only want to track actual navigation
        if (!skippedInitialRendering.current) {
            skippedInitialRendering.current = true;
            return;
        }

        if (step) {
            checkoutTelemetry.subscriptionContainer.reportChangeStep({
                step,
                build: APP_NAME,
                product: app,
            });
        }
    }, [step]);
};
