import { getTestPlansMap } from '../../testing/data-plans';
import { ADDON_NAMES, ADDON_PREFIXES, PLANS } from '../constants';
import {
    getAddonNameByPlan,
    isMultiUserPersonalPlan,
    organizationOrSubscriptionSupportsSSO,
    planSupportsSSO,
    subscriptionSupportsSSO,
} from './helpers';
import type { Plan } from './interface';

describe('getAddonNameByPlan', () => {
    it.each<[plan: PLANS, expectedAddon: ADDON_NAMES]>([
        [PLANS.MAIL_PRO, ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO],
        [PLANS.BUNDLE_PRO, ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO],
        [PLANS.BUNDLE_PRO_2024, ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024],
        [PLANS.MAIL_BUSINESS, ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS],
    ])('returns scribe %s -> %s', (plan, expectedAddon) => {
        expect(getAddonNameByPlan(ADDON_PREFIXES.SCRIBE, plan)).toBe(expectedAddon);
    });

    it('returns undefined for plans without scribe addon mapping', () => {
        expect(getAddonNameByPlan(ADDON_PREFIXES.SCRIBE, PLANS.MAIL)).toBeUndefined();
        expect(getAddonNameByPlan(ADDON_PREFIXES.SCRIBE, PLANS.VPN2024)).toBeUndefined();
    });

    it.each<[plan: PLANS, expectedAddon: ADDON_NAMES]>([
        // B2C
        [PLANS.MAIL, ADDON_NAMES.LUMO_MAIL],
        [PLANS.DRIVE, ADDON_NAMES.LUMO_DRIVE],
        [PLANS.DRIVE_1TB, ADDON_NAMES.LUMO_DRIVE_1TB],
        [PLANS.PASS, ADDON_NAMES.LUMO_PASS],
        [PLANS.PASS_FAMILY, ADDON_NAMES.LUMO_PASS_FAMILY],
        [PLANS.VPN2024, ADDON_NAMES.LUMO_VPN2024],
        [PLANS.BUNDLE, ADDON_NAMES.LUMO_BUNDLE],
        [PLANS.FAMILY, ADDON_NAMES.LUMO_FAMILY],
        [PLANS.DUO, ADDON_NAMES.LUMO_DUO],

        // B2B
        [PLANS.MAIL_PRO, ADDON_NAMES.LUMO_MAIL_PRO],
        [PLANS.MAIL_BUSINESS, ADDON_NAMES.LUMO_MAIL_BUSINESS],
        [PLANS.DRIVE_PRO, ADDON_NAMES.LUMO_DRIVE_PRO],
        [PLANS.DRIVE_BUSINESS, ADDON_NAMES.LUMO_DRIVE_BUSINESS],
        [PLANS.BUNDLE_PRO, ADDON_NAMES.LUMO_BUNDLE_PRO],
        [PLANS.BUNDLE_PRO_2024, ADDON_NAMES.LUMO_BUNDLE_PRO_2024],
        [PLANS.VPN_PRO, ADDON_NAMES.LUMO_VPN_PRO],
        [PLANS.VPN_BUSINESS, ADDON_NAMES.LUMO_VPN_BUSINESS],
        [PLANS.PASS_PRO, ADDON_NAMES.LUMO_PASS_PRO],
        [PLANS.PASS_BUSINESS, ADDON_NAMES.LUMO_PASS_BUSINESS],
        [PLANS.VPN_PASS_BUNDLE_BUSINESS, ADDON_NAMES.LUMO_VPN_PASS_BUNDLE_BUSINESS],
    ])('returns lumo %s -> %s', (plan, expectedAddon) => {
        expect(getAddonNameByPlan(ADDON_PREFIXES.LUMO, plan)).toBe(expectedAddon);
    });
});

describe('isMultiUserPersonalPlan', () => {
    it('should return true for multi user personal plans - PLANS enum', () => {
        expect(isMultiUserPersonalPlan(PLANS.DUO)).toBe(true);
        expect(isMultiUserPersonalPlan(PLANS.FAMILY)).toBe(true);
        expect(isMultiUserPersonalPlan(PLANS.VISIONARY)).toBe(true);
        expect(isMultiUserPersonalPlan(PLANS.PASS_FAMILY)).toBe(true);
    });

    it('should return true for multi user personal plans - Plan objects', () => {
        const duoPlan = getTestPlansMap()[PLANS.DUO] as Plan;
        expect(isMultiUserPersonalPlan(duoPlan)).toBe(true);

        const familyPlan = getTestPlansMap()[PLANS.FAMILY] as Plan;
        expect(isMultiUserPersonalPlan(familyPlan)).toBe(true);

        const visionaryPlan = getTestPlansMap()[PLANS.VISIONARY] as Plan;
        expect(isMultiUserPersonalPlan(visionaryPlan)).toBe(true);

        const passFamilyPlan = getTestPlansMap()[PLANS.PASS_FAMILY] as Plan;
        expect(isMultiUserPersonalPlan(passFamilyPlan)).toBe(true);
    });

    it('should return true for multi user personal plans - PlanIDs', () => {
        expect(isMultiUserPersonalPlan({ [PLANS.DUO]: 1 })).toBe(true);
        expect(isMultiUserPersonalPlan({ [PLANS.FAMILY]: 1 })).toBe(true);
        expect(isMultiUserPersonalPlan({ [PLANS.VISIONARY]: 1 })).toBe(true);
        expect(isMultiUserPersonalPlan({ [PLANS.PASS_FAMILY]: 1 })).toBe(true);
    });
});

describe('planSupportsSSO', () => {
    it('returns true for business plans that support SSO', () => {
        expect(planSupportsSSO(PLANS.VPN_BUSINESS, false)).toBe(true);
        expect(planSupportsSSO(PLANS.PASS_BUSINESS, false)).toBe(true);
        expect(planSupportsSSO(PLANS.LUMO_BUSINESS, false)).toBe(true);
    });

    it('returns false for plans without SSO support', () => {
        expect(planSupportsSSO(PLANS.MAIL, false)).toBe(false);
        expect(planSupportsSSO(undefined, false)).toBe(undefined);
    });
});

describe('subscriptionSupportsSSO', () => {
    it('returns true when subscription includes an SSO-capable plan', () => {
        expect(subscriptionSupportsSSO({ Plans: [{ Name: PLANS.LUMO_BUSINESS }] }, false)).toBe(true);
    });

    it('returns false when subscription has no SSO-capable plan', () => {
        expect(subscriptionSupportsSSO({ Plans: [{ Name: PLANS.LUMO }] }, false)).toBe(false);
    });
});

describe('organizationOrSubscriptionSupportsSSO', () => {
    it('returns true for Lumo Business via subscription when org plan name is missing', () => {
        expect(
            organizationOrSubscriptionSupportsSSO({
                organization: {},
                subscription: { Plans: [{ Name: PLANS.LUMO_BUSINESS }] },
                isSsoForPbsEnabled: false,
            })
        ).toBe(true);
    });
});
