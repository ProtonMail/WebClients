import { useEffect, useRef } from 'react';

import type { PlanIDs } from '@proton/payments/core/interface';
import { reportVpn2024SignupExperimentSeen } from '@proton/payments/telemetry/signup-experiment-telemetry';

import type { EnableVpn2024SignupExperimentVariant } from './getVpn2024SignupExperimentEnablement';
import {
    getVpn2024SignupExperimentEnablement,
    isVpn2024SignupExperimentEnabled,
} from './getVpn2024SignupExperimentEnablement';

export const useVpn2024SignupExperiment = (
    vpn2024SignupExperimentVariant: string | undefined,
    selectedPlanIDs: PlanIDs
) => {
    const hasSentTelemetryRef = useRef(false);
    const queryParam = vpn2024SignupExperimentVariant as EnableVpn2024SignupExperimentVariant;
    const isNoAddon: boolean = queryParam === 'no-addon';
    const isPassAddonOnly: boolean = queryParam === 'pass-addon-only';
    useEffect(() => {
        if (
            !isVpn2024SignupExperimentEnabled({ isPassAddonOnly, isNoAddon }, selectedPlanIDs) ||
            hasSentTelemetryRef.current
        ) {
            return;
        }

        hasSentTelemetryRef.current = true;
        reportVpn2024SignupExperimentSeen({
            variant: queryParam ?? 'disabled',
        });
    }, [selectedPlanIDs, isPassAddonOnly, isNoAddon]);

    return getVpn2024SignupExperimentEnablement({ isPassAddonOnly, isNoAddon }, selectedPlanIDs);
};
