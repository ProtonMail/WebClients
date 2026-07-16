import { PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';

export interface Vpn2024SignupExperimentEnablement {
    /** Whether to display the Pass upsell box on the signup page */
    displayPassAsFakeAddon: boolean;
    /** Whether the VPN+Pass bundle is the currently selected plan */
    isVPNPassBundle: boolean;
}

export type EnableVpn2024SignupExperimentVariant = 'pass-addon-only' | 'no-addon';

export const isVpn2024SignupExperimentEnabled = (
    variant: { isPassAddonOnly: boolean; isNoAddon: boolean },
    selectedPlanIDs: PlanIDs
): boolean => {
    const isVPN2024 = !!selectedPlanIDs[PLANS.VPN2024];
    const isVPNPassBundle = !!selectedPlanIDs[PLANS.VPN_PASS_BUNDLE];
    const isVPNPlusOrVPNPassBundle = isVPN2024 || isVPNPassBundle;

    return (variant.isPassAddonOnly || variant.isNoAddon) && isVPNPlusOrVPNPassBundle;
};

export const getVpn2024SignupExperimentEnablement = (
    variant: { isPassAddonOnly: boolean; isNoAddon: boolean },
    selectedPlanIDs: PlanIDs
): Vpn2024SignupExperimentEnablement => {
    const isVPNPassBundle = !!selectedPlanIDs[PLANS.VPN_PASS_BUNDLE];
    const isExperimentEnabled = isVpn2024SignupExperimentEnabled(variant, selectedPlanIDs);

    return {
        displayPassAsFakeAddon: isExperimentEnabled && variant.isPassAddonOnly,
        isVPNPassBundle,
    };
};
