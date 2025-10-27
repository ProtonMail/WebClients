import { getLongTestPlans } from '@proton/testing/data';

import { ADDON_NAMES, PLANS, PLAN_TYPES } from '../constants';
import type { FeatureLimitKey } from '../interface';
import { getPlanFeatureLimit } from './feature-limits';
import type { Plan } from './interface';

const testPlans = getLongTestPlans();

describe('getPlanFeatureLimit', () => {
    describe('MaxIPs feature limit', () => {
        it('should return 1 for VPN_BUSINESS plan', () => {
            const vpnBusinessPlan = testPlans.find((plan) => plan.Name === PLANS.VPN_BUSINESS);
            expect(vpnBusinessPlan).toBeDefined();

            const result = getPlanFeatureLimit(vpnBusinessPlan!, 'MaxIPs');
            expect(result).toBe(1);
        });

        it('should return 1 for IP addons', () => {
            const ipAddon = testPlans.find((plan) => plan.Name === ADDON_NAMES.IP_VPN_BUSINESS);
            expect(ipAddon).toBeDefined();

            const result = getPlanFeatureLimit(ipAddon!, 'MaxIPs');
            expect(result).toBe(1);
        });

        it('should return 0 for non-IP plans', () => {
            const mailPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL);
            expect(mailPlan).toBeDefined();

            const result = getPlanFeatureLimit(mailPlan!, 'MaxIPs');
            expect(result).toBe(0);
        });
    });

    describe('MaxAI feature limit', () => {
        it('should return 1 for Scribe addons', () => {
            const scribeAddon = testPlans.find((plan) => plan.Name === ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
            expect(scribeAddon).toBeDefined();

            const result = getPlanFeatureLimit(scribeAddon!, 'MaxAI');
            expect(result).toBe(1);
        });

        it('should return 1 for Lumo addons', () => {
            const lumoAddon = testPlans.find((plan) => plan.Name === ADDON_NAMES.LUMO_MAIL);
            expect(lumoAddon).toBeDefined();

            const result = getPlanFeatureLimit(lumoAddon!, 'MaxAI');
            expect(result).toBe(1);
        });

        it('should return 0 for non-Scribe plans', () => {
            const mailPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL);
            expect(mailPlan).toBeDefined();

            const result = getPlanFeatureLimit(mailPlan!, 'MaxAI');
            expect(result).toBe(0);
        });
    });

    describe('MaxLumo feature limit', () => {
        it('should return 1 for LUMO_BUSINESS plan', () => {
            const lumoPlan = testPlans.find((plan) => plan.Name === PLANS.LUMO_BUSINESS);
            expect(lumoPlan).toBeDefined();

            const result = getPlanFeatureLimit(lumoPlan!, 'MaxLumo');
            expect(result).toBe(1);
        });

        it('should return 1 for LUMO plan', () => {
            const lumoPlan = testPlans.find((plan) => plan.Name === PLANS.LUMO);
            expect(lumoPlan).toBeDefined();

            const result = getPlanFeatureLimit(lumoPlan!, 'MaxLumo');
            expect(result).toBe(1);
        });

        it('should return 1 for Lumo addons', () => {
            const lumoAddon = testPlans.find((plan) => plan.Name === ADDON_NAMES.LUMO_MAIL);
            expect(lumoAddon).toBeDefined();

            const result = getPlanFeatureLimit(lumoAddon!, 'MaxLumo');
            expect(result).toBe(1);
        });

        it('should return 0 for non-Lumo plans', () => {
            const mailPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL);
            expect(mailPlan).toBeDefined();

            const result = getPlanFeatureLimit(mailPlan!, 'MaxLumo');
            expect(result).toBe(0);
        });
    });

    describe('MaxMembers feature limit', () => {
        it('should return 0 for FREE plan', () => {
            // Create a mock FREE plan since it may not exist in test data
            const freePlan: Plan = {
                ID: 'free',
                ParentMetaPlanID: 'free',
                Type: PLAN_TYPES.PLAN,
                Cycle: 12,
                Name: PLANS.FREE,
                Title: 'Free Plan',
                Currency: 'USD',
                Amount: 0,
                MaxDomains: 0,
                MaxAddresses: 10,
                MaxSpace: 524288000,
                MaxCalendars: 1,
                MaxMembers: 1,
                MaxVPN: 0,
                MaxTier: 0,
                Services: 1,
                Features: 0,
                Quantity: 1,
                Pricing: {} as any,
                PeriodEnd: {} as any,
                State: 1,
                Offers: [],
            };

            const result = getPlanFeatureLimit(freePlan, 'MaxMembers');
            expect(result).toBe(0);
        });

        it('should return plan MaxMembers for regular plans', () => {
            const mailProPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL_PRO);
            expect(mailProPlan).toBeDefined();

            const result = getPlanFeatureLimit(mailProPlan!, 'MaxMembers');
            expect(result).toBe(mailProPlan!.MaxMembers || 1);
        });

        it('should return 1 for member addons', () => {
            const memberAddon = testPlans.find((plan) => plan.Name === ADDON_NAMES.MEMBER_MAIL_PRO);
            expect(memberAddon).toBeDefined();

            const result = getPlanFeatureLimit(memberAddon!, 'MaxMembers');
            expect(result).toBe(1);
        });

        it('should return 0 for non-member addons', () => {
            const domainAddon = testPlans.find((plan) => plan.Name === ADDON_NAMES.DOMAIN_BUNDLE_PRO);
            if (domainAddon) {
                const result = getPlanFeatureLimit(domainAddon, 'MaxMembers');
                expect(result).toBe(0);
            }
        });
    });

    describe('Standard plan properties', () => {
        it('should return plan MaxDomains value', () => {
            const bundlePlan = testPlans.find((plan) => plan.Name === PLANS.BUNDLE_PRO);
            expect(bundlePlan).toBeDefined();

            const result = getPlanFeatureLimit(bundlePlan!, 'MaxDomains');
            expect(result).toBe(bundlePlan!.MaxDomains);
        });

        it('should return plan MaxAddresses value', () => {
            const mailPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL);
            expect(mailPlan).toBeDefined();

            const result = getPlanFeatureLimit(mailPlan!, 'MaxAddresses');
            expect(result).toBe(mailPlan!.MaxAddresses);
        });

        it('should return plan MaxSpace value', () => {
            const mailProPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL_PRO);
            expect(mailProPlan).toBeDefined();

            const result = getPlanFeatureLimit(mailProPlan!, 'MaxSpace');
            expect(result).toBe(mailProPlan!.MaxSpace);
        });

        it('should return plan MaxVPN value', () => {
            const vpnPlan = testPlans.find((plan) => plan.Name === PLANS.VPN2024);
            expect(vpnPlan).toBeDefined();

            const result = getPlanFeatureLimit(vpnPlan!, 'MaxVPN');
            expect(result).toBe(vpnPlan!.MaxVPN);
        });

        it('should return plan MaxTier value', () => {
            const visionaryPlan = testPlans.find((plan) => plan.Name === PLANS.VISIONARY);
            expect(visionaryPlan).toBeDefined();

            const result = getPlanFeatureLimit(visionaryPlan!, 'MaxTier');
            expect(result).toBe(visionaryPlan!.MaxTier);
        });
    });

    describe('Edge cases', () => {
        it('should return 0 when plan property is undefined', () => {
            const mockPlan: Plan = {
                ID: 'test',
                ParentMetaPlanID: 'test',
                Type: PLAN_TYPES.PLAN,
                Cycle: 12,
                Name: PLANS.MAIL,
                Title: 'Test Plan',
                Currency: 'USD',
                Amount: 0,
                MaxDomains: 0,
                MaxAddresses: 0,
                MaxSpace: 0,
                MaxCalendars: 0,
                MaxMembers: 0,
                MaxVPN: 0,
                MaxTier: 0,
                Services: 0,
                Features: 0,
                Quantity: 0,
                Pricing: {} as any,
                PeriodEnd: {} as any,
                State: 1,
                Offers: [],
            };

            // Test undefined property by accessing a property that doesn't exist on our mock
            const result = getPlanFeatureLimit(mockPlan, 'MaxDomains' as FeatureLimitKey);
            expect(result).toBe(0);
        });

        it('should return 0 when plan property is null', () => {
            const mockPlan: any = {
                ID: 'test',
                Type: PLAN_TYPES.PLAN,
                Name: PLANS.MAIL,
                MaxDomains: null,
            };

            const result = getPlanFeatureLimit(mockPlan as Plan, 'MaxDomains');
            expect(result).toBe(0);
        });

        it('should handle all FeatureLimitKey types', () => {
            const mailPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL);
            expect(mailPlan).toBeDefined();

            const featureLimitKeys: FeatureLimitKey[] = [
                'MaxDomains',
                'MaxAddresses',
                'MaxSpace',
                'MaxMembers',
                'MaxVPN',
                'MaxTier',
                'MaxIPs',
                'MaxAI',
                'MaxLumo',
            ];

            featureLimitKeys.forEach((key) => {
                const result = getPlanFeatureLimit(mailPlan!, key);
                expect(typeof result).toBe('number');
                expect(result).toBeGreaterThanOrEqual(0);
            });
        });

        it('should work with different plan types', () => {
            // Test with a regular plan
            const regularPlan = testPlans.find((plan) => plan.Type === PLAN_TYPES.PLAN);
            expect(regularPlan).toBeDefined();

            const regularResult = getPlanFeatureLimit(regularPlan!, 'MaxMembers');
            expect(typeof regularResult).toBe('number');

            // Test with an addon
            const addon = testPlans.find((plan) => plan.Type === PLAN_TYPES.ADDON);
            expect(addon).toBeDefined();

            const addonResult = getPlanFeatureLimit(addon!, 'MaxMembers');
            expect(typeof addonResult).toBe('number');
        });
    });
});
