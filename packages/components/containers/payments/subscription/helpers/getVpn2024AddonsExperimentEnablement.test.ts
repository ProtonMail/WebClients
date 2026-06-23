import { ADDON_NAMES, PLANS, type PlanIDs } from '@proton/payments';
import type { FeatureFlagVariant, FeatureFlagsWithVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

import {
    getVpn2024AddonsExperimentEnablement,
    isVpn2024AddonsExperimentEnabled,
} from './getVpn2024AddonsExperimentEnablement';

type Variant = FeatureFlagVariant<FeatureFlagsWithVariant>;

const variant = (name: string): Variant => ({ name }) as Variant;

const DISABLED = variant('disabled');
const NO_ADDON = variant('no-addon');
const PASS_ADDON_ONLY = variant('pass-addon-only');
const LUMO_ADDON_ONLY = variant('lumo-addon-only');
const MEET_ADDON_ONLY = variant('meet-addon-only');

describe('isVpn2024AddonsExperimentEnabled', () => {
    it('should return false when flags are not ready', () => {
        expect(isVpn2024AddonsExperimentEnabled(false, NO_ADDON, { [PLANS.VPN2024]: 1 })).toBe(false);
    });

    it('should return false when the variant is disabled', () => {
        expect(isVpn2024AddonsExperimentEnabled(true, DISABLED, { [PLANS.VPN2024]: 1 })).toBe(false);
    });

    it('should return false when the plan is neither VPN2024 nor VPN Pass bundle', () => {
        expect(isVpn2024AddonsExperimentEnabled(true, NO_ADDON, { [PLANS.MAIL]: 1 })).toBe(false);
    });

    it('should return true for a VPN2024 plan', () => {
        expect(isVpn2024AddonsExperimentEnabled(true, NO_ADDON, { [PLANS.VPN2024]: 1 })).toBe(true);
    });

    it('should return true for a VPN Pass bundle plan', () => {
        expect(isVpn2024AddonsExperimentEnabled(true, NO_ADDON, { [PLANS.VPN_PASS_BUNDLE]: 1 })).toBe(true);
    });
});

describe('getVpn2024AddonsExperimentEnablement', () => {
    describe('when the experiment is not enabled', () => {
        it('should return all flags disabled', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, DISABLED, { [PLANS.VPN2024]: 1 });

            expect(result).toEqual({
                overrideAddonsBehaviour: false,
                displayPassAsFakeAddon: false,
                displayLumo: false,
                displayMeet: false,
                canDisplayAddonCustomizer: true,
                isVPNPass2023: false,
            });
        });

        it('should still report isVPNPass2023 for a VPN Pass bundle plan', () => {
            const result = getVpn2024AddonsExperimentEnablement(false, NO_ADDON, { [PLANS.VPN_PASS_BUNDLE]: 1 });

            expect(result.isVPNPass2023).toBe(true);
            expect(result.overrideAddonsBehaviour).toBe(false);
        });
    });

    describe('when the experiment is enabled', () => {
        it('should hide the addon customizer for the no-addon variant when the user has no addons', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, NO_ADDON, { [PLANS.VPN2024]: 1 });

            expect(result).toEqual({
                overrideAddonsBehaviour: true,
                displayPassAsFakeAddon: false,
                displayLumo: false,
                displayMeet: false,
                canDisplayAddonCustomizer: false,
                isVPNPass2023: false,
            });
        });

        it('should display the fake pass addon for the pass-addon-only variant', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, PASS_ADDON_ONLY, { [PLANS.VPN2024]: 1 });

            expect(result.displayPassAsFakeAddon).toBe(true);
            expect(result.canDisplayAddonCustomizer).toBe(false);
            expect(result.displayLumo).toBe(false);
            expect(result.displayMeet).toBe(false);
        });

        it('should display lumo for the lumo-addon-only variant', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, LUMO_ADDON_ONLY, { [PLANS.VPN2024]: 1 });

            expect(result.displayLumo).toBe(true);
            expect(result.displayMeet).toBe(false);
            expect(result.canDisplayAddonCustomizer).toBe(true);
        });

        it('should display meet for the meet-addon-only variant', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, MEET_ADDON_ONLY, { [PLANS.VPN2024]: 1 });

            expect(result.displayMeet).toBe(true);
            expect(result.displayLumo).toBe(false);
            expect(result.canDisplayAddonCustomizer).toBe(true);
        });
    });

    describe('when the user already has addons (allow removal)', () => {
        const withLumo: PlanIDs = { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 };
        const withMeet: PlanIDs = { [PLANS.VPN2024]: 1, [ADDON_NAMES.MEET_VPN2024]: 1 };
        const withBoth: PlanIDs = {
            [PLANS.VPN2024]: 1,
            [ADDON_NAMES.LUMO_VPN2024]: 1,
            [ADDON_NAMES.MEET_VPN2024]: 1,
        };

        it('should display lumo when the user already has a lumo addon, regardless of the variant', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, PASS_ADDON_ONLY, withLumo);

            expect(result.displayLumo).toBe(true);
        });

        it('should display meet when the user already has a meet addon, regardless of the variant', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, PASS_ADDON_ONLY, withMeet);

            expect(result.displayMeet).toBe(true);
        });

        it('should not hide existing addons behind the no-addon variant for a lumo addon', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, NO_ADDON, withLumo);

            expect(result.canDisplayAddonCustomizer).toBe(true);
            expect(result.displayLumo).toBe(true);
            expect(result.displayMeet).toBe(false);
        });

        it('should not hide existing addons behind the no-addon variant for a meet addon', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, NO_ADDON, withMeet);

            expect(result.canDisplayAddonCustomizer).toBe(true);
            expect(result.displayMeet).toBe(true);
            expect(result.displayLumo).toBe(false);
        });

        it('should display both addons when the user has both, under the no-addon variant', () => {
            const result = getVpn2024AddonsExperimentEnablement(true, NO_ADDON, withBoth);

            expect(result.canDisplayAddonCustomizer).toBe(true);
            expect(result.displayLumo).toBe(true);
            expect(result.displayMeet).toBe(true);
        });
    });
});
