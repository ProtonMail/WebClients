import { PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { FeatureFlagVariant, FeatureFlagsWithVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

export interface PassAsFakeAddonEnablement {
    noAddonVariant: boolean;
    displayPassAsFakeAddonOnly: boolean;
    displayLumoOnly: boolean;
    displayMeetOnly: boolean;
    isVPNPass2023: boolean;
    overrideAddonsBehaviour: boolean;
}

export const isVpn2024AddonsExperimentEnabled = (
    flagsReady: boolean,
    vpn2024AddonsExperiment: FeatureFlagVariant<FeatureFlagsWithVariant>,
    selectedPlanIDs: PlanIDs
): boolean => {
    const isVPN2024 = !!selectedPlanIDs[PLANS.VPN2024];
    const isVPNPass2023 = !!selectedPlanIDs[PLANS.VPN_PASS_BUNDLE];
    const isVPNPlusOrVPNPassBundle = isVPN2024 || isVPNPass2023;

    return flagsReady && vpn2024AddonsExperiment.name !== 'disabled' && isVPNPlusOrVPNPassBundle;
};

export const getVpn2024AddonsExperimentEnablement = (
    flagsReady: boolean,
    vpn2024AddonsExperiment: FeatureFlagVariant<FeatureFlagsWithVariant>,
    selectedPlanIDs: PlanIDs
): PassAsFakeAddonEnablement => {
    const isVPNPass2023 = !!selectedPlanIDs[PLANS.VPN_PASS_BUNDLE];

    if (!isVpn2024AddonsExperimentEnabled(flagsReady, vpn2024AddonsExperiment, selectedPlanIDs)) {
        return {
            overrideAddonsBehaviour: false,
            noAddonVariant: false,
            displayPassAsFakeAddonOnly: false,
            displayLumoOnly: false,
            displayMeetOnly: false,
            isVPNPass2023,
        };
    }

    const noAddonVariant = vpn2024AddonsExperiment.name === 'no-addon';
    const displayPassAsFakeAddonOnly = vpn2024AddonsExperiment.name === 'pass-addon-only';
    const displayLumoOnly = vpn2024AddonsExperiment.name === 'lumo-addon-only';
    const displayMeetOnly = vpn2024AddonsExperiment.name === 'meet-addon-only';

    return {
        overrideAddonsBehaviour: true,
        noAddonVariant,
        displayPassAsFakeAddonOnly,
        displayLumoOnly,
        displayMeetOnly,
        isVPNPass2023,
    };
};
