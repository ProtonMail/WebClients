import { useEffect, useRef } from 'react';

import { useFlagsStatus } from '@unleash/proxy-client-react';

import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useVariant } from '@proton/unleash/useVariant';

import {
    type CheckoutCondensedAddonsParams,
    getCheckoutCondensedAddons,
    getIsEligibleForCheckoutCondensedAddons,
} from './getCheckoutCondensedAddons';

export const useCheckoutCondensedAddons = (args: Omit<CheckoutCondensedAddonsParams, 'flagsReady' | 'variant'>) => {
    const { flagsReady } = useFlagsStatus();
    const variant = useVariant('CheckoutCondensedAddons');
    const variantName = variant.name;
    const isEligible = getIsEligibleForCheckoutCondensedAddons(args);

    // Report exposure once per checkout opening, only for eligible users assigned to an arm, so ineligible
    // users and users outside the rollout send nothing to Proton Analytics
    const hasSentTelemetryRef = useRef(false);
    useEffect(() => {
        if (
            hasSentTelemetryRef.current ||
            !flagsReady ||
            !isEligible ||
            (variantName !== 'control' && variantName !== 'condensed')
        ) {
            return;
        }

        hasSentTelemetryRef.current = true;
        checkoutTelemetry.subscriptionContainer.reportCheckoutCondensedAddonsExperimentSeen({ variant: variantName });
    }, [flagsReady, isEligible, variantName]);

    return getCheckoutCondensedAddons({ ...args, flagsReady, variant }) === 'condensed';
};
