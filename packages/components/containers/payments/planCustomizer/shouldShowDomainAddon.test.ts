import { ADDON_NAMES, CYCLE, PLANS, SelectedPlan } from '@proton/payments/index';
import { getTestPlansMap } from '@proton/testing/data';

import { shouldShowDomainAddon } from './shouldShowDomainAddon';

describe('shouldShowDomainAddon', () => {
    it('should return true if the addon name is not DOMAIN_VPN_BUSINESS', () => {
        expect(
            shouldShowDomainAddon({
                addonName: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024,
                currentPlan: new SelectedPlan(
                    { [PLANS.BUNDLE_PRO_2024]: 1 },
                    getTestPlansMap('EUR'),
                    CYCLE.MONTHLY,
                    'EUR'
                ),
                domainVpnBiz2023Enabled: false,
                mode: undefined,
            })
        ).toBe(true);
    });

    it('should return true if the domain vpnbiz2023 feature flag is enabled', () => {
        expect(
            shouldShowDomainAddon({
                addonName: ADDON_NAMES.DOMAIN_VPN_BUSINESS,
                currentPlan: new SelectedPlan(
                    { [PLANS.VPN_BUSINESS]: 1 },
                    getTestPlansMap('EUR'),
                    CYCLE.MONTHLY,
                    'EUR'
                ),
                domainVpnBiz2023Enabled: true,
                mode: undefined,
            })
        ).toBe(true);
    });

    it('should return false if the domain vpnbiz2023 feature flag is disabled and the current plan has no additional domains', () => {
        expect(
            shouldShowDomainAddon({
                addonName: ADDON_NAMES.DOMAIN_VPN_BUSINESS,
                currentPlan: new SelectedPlan(
                    { [PLANS.VPN_BUSINESS]: 1 },
                    getTestPlansMap('EUR'),
                    CYCLE.MONTHLY,
                    'EUR'
                ),
                domainVpnBiz2023Enabled: false,
                mode: undefined,
            })
        ).toBe(false);
    });

    it('should return true if the domain vpnbiz2023 feature flag is disabled and the current plan has additional domains', () => {
        expect(
            shouldShowDomainAddon({
                addonName: ADDON_NAMES.DOMAIN_VPN_BUSINESS,
                currentPlan: new SelectedPlan(
                    { [PLANS.VPN_BUSINESS]: 1, [ADDON_NAMES.DOMAIN_VPN_BUSINESS]: 1 },
                    getTestPlansMap('EUR'),
                    CYCLE.MONTHLY,
                    'EUR'
                ),
                domainVpnBiz2023Enabled: false,
                mode: undefined,
            })
        ).toBe(true);
    });

    it('should return false if the mode is signup even if the feature flag is enabled', () => {
        expect(
            shouldShowDomainAddon({
                addonName: ADDON_NAMES.DOMAIN_VPN_BUSINESS,
                currentPlan: new SelectedPlan(
                    { [PLANS.VPN_BUSINESS]: 1 },
                    getTestPlansMap('EUR'),
                    CYCLE.MONTHLY,
                    'EUR'
                ),
                domainVpnBiz2023Enabled: true,
                mode: 'signup',
            })
        ).toBe(false);
    });
});
