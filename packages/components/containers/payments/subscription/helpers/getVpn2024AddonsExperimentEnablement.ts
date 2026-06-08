import { PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { hasLumoAddonFromPlanIDs, hasMeetAddonFromPlanIDs } from '@proton/payments/core/plan/addons';
import type { FeatureFlagVariant, FeatureFlagsWithVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

export interface PassAsFakeAddonEnablement {
    displayPassAsFakeAddon: boolean;
    displayLumo: boolean;
    displayMeet: boolean;
    isVPNPass2023: boolean;
    canDisplayAddonCustomizer: boolean;
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
    const isExperimentEnabled = isVpn2024AddonsExperimentEnabled(flagsReady, vpn2024AddonsExperiment, selectedPlanIDs);

    if (!isExperimentEnabled) {
        return {
            overrideAddonsBehaviour: false,
            displayPassAsFakeAddon: false,
            displayLumo: false,
            displayMeet: false,
            canDisplayAddonCustomizer: true,
            isVPNPass2023,
        };
    }

    const hasExistingLumoAddon = hasLumoAddonFromPlanIDs(selectedPlanIDs);
    const hasExistingMeetAddon = hasMeetAddonFromPlanIDs(selectedPlanIDs);

    // Allow users having addons to remove them
    const noAddonVariant = vpn2024AddonsExperiment.name === 'no-addon';
    const displayPassAsFakeAddon = vpn2024AddonsExperiment.name === 'pass-addon-only';
    const displayLumo = vpn2024AddonsExperiment.name === 'lumo-addon-only' || hasExistingLumoAddon;
    const displayMeet = vpn2024AddonsExperiment.name === 'meet-addon-only' || hasExistingMeetAddon;

    const experimentAllowAddonCustomizer = !displayPassAsFakeAddon && !noAddonVariant;
    const canDisplayAddonCustomizer = displayLumo || displayMeet || experimentAllowAddonCustomizer;

    return {
        overrideAddonsBehaviour: true,
        displayPassAsFakeAddon,
        displayLumo,
        displayMeet,
        canDisplayAddonCustomizer,
        isVPNPass2023,
    };
};
