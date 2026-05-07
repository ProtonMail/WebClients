import { useEffect, useRef } from 'react';

import type { PlanIDs } from '@proton/payments/core/interface';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import type { FeatureFlagVariant, FeatureFlagsWithVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useVariant } from '@proton/unleash/useVariant';

import {
    getVpn2024AddonsExperimentEnablement,
    isVpn2024AddonsExperimentEnabled,
} from './getVpn2024AddonsExperimentEnablement';

export const useVpn2024AddonsExperiment = (selectedPlanIDs: PlanIDs) => {
    const { flagsReady } = useFlagsStatus();
    const vpn2024AddonsExperiment: FeatureFlagVariant<FeatureFlagsWithVariant> = useVariant('Vpn2024AddonsExperiment');

    const hasSentTelemetryRef = useRef(false);
    useEffect(() => {
        if (
            !isVpn2024AddonsExperimentEnabled(flagsReady, vpn2024AddonsExperiment, selectedPlanIDs) ||
            hasSentTelemetryRef.current
        ) {
            return;
        }

        hasSentTelemetryRef.current = true;
        checkoutTelemetry.subscriptionContainer.reportVpn2024AddonsExperimentSeen({
            variant: vpn2024AddonsExperiment.name ?? 'disabled',
        });
    }, [flagsReady, selectedPlanIDs]);

    return getVpn2024AddonsExperimentEnablement(flagsReady, vpn2024AddonsExperiment, selectedPlanIDs);
};
