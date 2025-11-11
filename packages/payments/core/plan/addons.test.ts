import { ADDON_NAMES, PLANS } from '../constants';
import type { PlanIDs } from '../interface';
import type { SupportedAddons } from './addons';
import { getSupportedAddons, supportsMemberAddon } from './addons';

describe('getSupportedAddons', () => {
    describe('B2C plans', () => {
        it('should return correct addons for PLANS.MAIL', () => {
            const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_MAIL]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.DRIVE', () => {
            const planIDs: PlanIDs = { [PLANS.DRIVE]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_DRIVE]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.DRIVE_1TB', () => {
            const planIDs: PlanIDs = { [PLANS.DRIVE_1TB]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_DRIVE_1TB]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.PASS', () => {
            const planIDs: PlanIDs = { [PLANS.PASS]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_PASS]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.PASS_FAMILY', () => {
            const planIDs: PlanIDs = { [PLANS.PASS_FAMILY]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_PASS_FAMILY]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.VPN2024', () => {
            const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_VPN2024]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.BUNDLE', () => {
            const planIDs: PlanIDs = { [PLANS.BUNDLE]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_BUNDLE]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.FAMILY', () => {
            const planIDs: PlanIDs = { [PLANS.FAMILY]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_FAMILY]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.DUO', () => {
            const planIDs: PlanIDs = { [PLANS.DUO]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_DUO]: true,
            };
            expect(result).toEqual(expected);
        });
    });

    describe('B2B plans', () => {
        it('should return correct addons for PLANS.MAIL_PRO', () => {
            const planIDs: PlanIDs = { [PLANS.MAIL_PRO]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_MAIL_PRO]: true,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: true,
                [ADDON_NAMES.LUMO_MAIL_PRO]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.MAIL_BUSINESS', () => {
            const planIDs: PlanIDs = { [PLANS.MAIL_BUSINESS]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: true,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: true,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.DRIVE_PRO', () => {
            const planIDs: PlanIDs = { [PLANS.DRIVE_PRO]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_DRIVE_PRO]: true,
                [ADDON_NAMES.LUMO_DRIVE_PRO]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.DRIVE_BUSINESS', () => {
            const planIDs: PlanIDs = { [PLANS.DRIVE_BUSINESS]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_DRIVE_BUSINESS]: true,
                [ADDON_NAMES.LUMO_DRIVE_BUSINESS]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.BUNDLE_PRO', () => {
            const planIDs: PlanIDs = { [PLANS.BUNDLE_PRO]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_BUNDLE_PRO]: true,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: true,
                [ADDON_NAMES.IP_BUNDLE_PRO]: true,
                [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO]: true,
                [ADDON_NAMES.LUMO_BUNDLE_PRO]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.BUNDLE_PRO_2024', () => {
            const planIDs: PlanIDs = { [PLANS.BUNDLE_PRO_2024]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: true,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: true,
                [ADDON_NAMES.IP_BUNDLE_PRO_2024]: true,
                [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: true,
                [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.VPN_PRO', () => {
            const planIDs: PlanIDs = { [PLANS.VPN_PRO]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_VPN_PRO]: true,
                [ADDON_NAMES.LUMO_VPN_PRO]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.VPN_BUSINESS', () => {
            const planIDs: PlanIDs = { [PLANS.VPN_BUSINESS]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: true,
                [ADDON_NAMES.IP_VPN_BUSINESS]: true,
                [ADDON_NAMES.LUMO_VPN_BUSINESS]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.PASS_PRO', () => {
            const planIDs: PlanIDs = { [PLANS.PASS_PRO]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_PASS_PRO]: true,
                [ADDON_NAMES.LUMO_PASS_PRO]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.PASS_BUSINESS', () => {
            const planIDs: PlanIDs = { [PLANS.PASS_BUSINESS]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_PASS_BUSINESS]: true,
                [ADDON_NAMES.LUMO_PASS_BUSINESS]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.VPN_PASS_BUNDLE_BUSINESS', () => {
            const planIDs: PlanIDs = { [PLANS.VPN_PASS_BUNDLE_BUSINESS]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS]: true,
                [ADDON_NAMES.LUMO_VPN_PASS_BUNDLE_BUSINESS]: true,
                [ADDON_NAMES.IP_VPN_PASS_BUNDLE_BUSINESS]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should return correct addons for PLANS.LUMO_BUSINESS', () => {
            const planIDs: PlanIDs = { [PLANS.LUMO_BUSINESS]: 1 };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.MEMBER_LUMO_BUSINESS]: true,
            };
            expect(result).toEqual(expected);
        });
    });

    describe('Plans without supported addons', () => {
        it.each([
            PLANS.FREE,
            PLANS.VPN,
            PLANS.DRIVE_LITE,
            PLANS.VISIONARY,
            PLANS.VPN_PASS_BUNDLE,
            PLANS.PASS_LIFETIME,
            PLANS.LUMO,
        ])('should return empty object for %s', (plan) => {
            const planIDs: PlanIDs = { [plan]: 1 };
            const result = getSupportedAddons(planIDs);
            expect(result).toEqual({});
        });
    });

    describe('Edge cases', () => {
        it('should return empty object for empty planIDs', () => {
            const planIDs: PlanIDs = {};
            const result = getSupportedAddons(planIDs);
            expect(result).toEqual({});
        });

        it('should handle plans with zero quantity', () => {
            const planIDs: PlanIDs = { [PLANS.MAIL]: 0 };
            const result = getSupportedAddons(planIDs);
            expect(result).toEqual({});
        });

        it('should handle mixed zero and non-zero quantities', () => {
            const planIDs: PlanIDs = {
                [PLANS.MAIL]: 0,
                [PLANS.DRIVE]: 1,
            };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_DRIVE]: true,
            };
            expect(result).toEqual(expected);
        });

        it('should handle undefined plan values', () => {
            const planIDs: PlanIDs = {
                [PLANS.MAIL]: undefined,
                [PLANS.DRIVE]: 1,
            };
            const result = getSupportedAddons(planIDs);
            const expected: SupportedAddons = {
                [ADDON_NAMES.LUMO_DRIVE]: true,
            };
            expect(result).toEqual(expected);
        });
    });

    describe('Completeness verification', () => {
        // This test ensures we haven't missed any plan mappings
        it('should have tests for all plans that return non-empty addons', () => {
            const allPlans = Object.values(PLANS);
            const plansWithAddons: PLANS[] = [];

            for (const plan of allPlans) {
                const planIDs: PlanIDs = { [plan]: 1 };
                const addons = getSupportedAddons(planIDs);
                if (Object.keys(addons).length > 0) {
                    plansWithAddons.push(plan);
                }
            }

            const expectedPlansWithAddons = [
                // B2C plans
                PLANS.MAIL,
                PLANS.DRIVE,
                PLANS.DRIVE_1TB,
                PLANS.PASS,
                PLANS.PASS_FAMILY,
                PLANS.VPN2024,
                PLANS.BUNDLE,
                PLANS.FAMILY,
                PLANS.DUO,
                // B2B plans
                PLANS.MAIL_PRO,
                PLANS.MAIL_BUSINESS,
                PLANS.DRIVE_PRO,
                PLANS.DRIVE_BUSINESS,
                PLANS.BUNDLE_PRO,
                PLANS.BUNDLE_PRO_2024,
                PLANS.VPN_PRO,
                PLANS.VPN_BUSINESS,
                PLANS.PASS_PRO,
                PLANS.PASS_BUSINESS,
                PLANS.LUMO_BUSINESS,
                PLANS.VPN_PASS_BUNDLE_BUSINESS,
            ];

            expect(plansWithAddons.sort()).toEqual(expectedPlansWithAddons.sort());
        });
    });
});

describe('supportsMemberAddon', () => {
    it('should return true if the plan supports member addon', () => {
        expect(supportsMemberAddon({ [PLANS.MAIL_PRO]: 1 })).toBe(true);
    });

    it('should return false if the plan does not support member addon', () => {
        expect(supportsMemberAddon({ [PLANS.MAIL]: 1 })).toBe(false);
    });
});
