import { PLANS } from '@proton/payments/core/constants';

import {
    getVpn2024SignupExperimentEnablement,
    isVpn2024SignupExperimentEnabled,
} from './getVpn2024SignupExperimentEnablement';

const DISABLED = { isPassAddonOnly: false, isNoAddon: false };
const NO_ADDON = { isPassAddonOnly: false, isNoAddon: true };
const PASS_ADDON_ONLY = { isPassAddonOnly: true, isNoAddon: false };

describe('isVpn2024SignupExperimentEnabled', () => {
    it('should return false when the variant is disabled', () => {
        expect(isVpn2024SignupExperimentEnabled(DISABLED, { [PLANS.VPN2024]: 1 })).toBe(false);
    });

    it('should return false when the plan is neither VPN2024 nor VPN Pass bundle', () => {
        expect(isVpn2024SignupExperimentEnabled(PASS_ADDON_ONLY, { [PLANS.MAIL]: 1 })).toBe(false);
    });

    it('should return true for a VPN2024 plan', () => {
        expect(isVpn2024SignupExperimentEnabled(PASS_ADDON_ONLY, { [PLANS.VPN2024]: 1 })).toBe(true);
    });

    it('should return true for a VPN Pass bundle plan', () => {
        expect(isVpn2024SignupExperimentEnabled(PASS_ADDON_ONLY, { [PLANS.VPN_PASS_BUNDLE]: 1 })).toBe(true);
    });

    it('should return true for the no-addon variant', () => {
        expect(isVpn2024SignupExperimentEnabled(NO_ADDON, { [PLANS.VPN2024]: 1 })).toBe(true);
    });
});

describe('getVpn2024SignupExperimentEnablement', () => {
    it('should not display the box when the experiment is disabled', () => {
        expect(getVpn2024SignupExperimentEnablement(DISABLED, { [PLANS.VPN2024]: 1 })).toEqual({
            displayPassAsFakeAddon: false,
            isVPNPassBundle: false,
        });
    });

    it('should not display the box for the no-addon variant', () => {
        expect(getVpn2024SignupExperimentEnablement(NO_ADDON, { [PLANS.VPN2024]: 1 })).toEqual({
            displayPassAsFakeAddon: false,
            isVPNPassBundle: false,
        });
    });

    it('should display the box for the pass-addon-only variant on a VPN2024 plan', () => {
        expect(getVpn2024SignupExperimentEnablement(PASS_ADDON_ONLY, { [PLANS.VPN2024]: 1 })).toEqual({
            displayPassAsFakeAddon: true,
            isVPNPassBundle: false,
        });
    });

    it('should report isVPNPassBundle and display the box for a selected VPN Pass bundle', () => {
        expect(getVpn2024SignupExperimentEnablement(PASS_ADDON_ONLY, { [PLANS.VPN_PASS_BUNDLE]: 1 })).toEqual({
            displayPassAsFakeAddon: true,
            isVPNPassBundle: true,
        });
    });
});
