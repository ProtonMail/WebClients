import type { ReactNode } from 'react';
import { useCallback } from 'react';

import type { UpsellTelemetryContext } from '@proton/payments/telemetry/shared-checkout-telemetry';

import type { OpenSubscriptionModalCallback } from './subscriptionModalContext';
import { SubscriptionModalContext, useSubscriptionModal } from './subscriptionModalContext';

export const UpsellModalTelemetryProvider = ({
    context,
    children,
}: {
    context: UpsellTelemetryContext;
    children: ReactNode;
}) => {
    const [open, loadingData, isSubscriptionModalAvailable] = useSubscriptionModal();

    const openCallback = useCallback<OpenSubscriptionModalCallback>(
        (props) => open({ ...props, upsellTelemetryContext: context }),
        [open, context]
    );

    return (
        <SubscriptionModalContext.Provider value={[openCallback, loadingData, isSubscriptionModalAvailable]}>
            {children}
        </SubscriptionModalContext.Provider>
    );
};
