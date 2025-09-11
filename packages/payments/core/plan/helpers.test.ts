import { getTestPlansMap } from '@proton/testing/data';

import { ADDON_NAMES, PLANS } from '../constants';
import { getLumoAddonNameByPlan, getScribeAddonNameByPlan, isMultiUserPersonalPlan } from './helpers';
import type { Plan } from './interface';

describe('getScribeAddonNameByPlan', () => {
    it.each<[plan: PLANS, expectedAddon: ADDON_NAMES]>([
        [PLANS.MAIL_PRO, ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO],
        [PLANS.BUNDLE_PRO, ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO],
        [PLANS.BUNDLE_PRO_2024, ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024],
        [PLANS.MAIL_BUSINESS, ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS],
    ])('returns %s -> %s', (plan, expectedAddon) => {
        expect(getScribeAddonNameByPlan(plan)).toBe(expectedAddon);
    });

    it('returns undefined for plans without scribe addon mapping', () => {
        expect(getScribeAddonNameByPlan(PLANS.MAIL)).toBeUndefined();
        expect(getScribeAddonNameByPlan(PLANS.VPN2024)).toBeUndefined();
    });
});

describe('getLumoAddonNameByPlan', () => {
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
    ])('returns %s -> %s', (plan, expectedAddon) => {
        expect(getLumoAddonNameByPlan(plan)).toBe(expectedAddon);
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
