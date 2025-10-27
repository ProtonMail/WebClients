import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP } from '@proton/testing/data';

import { ADDON_NAMES, ADDON_PREFIXES, CYCLE, FREE_SUBSCRIPTION, PLANS } from '../constants';
import { FREE_PLAN } from './freePlans';
import { SelectedPlan } from './selected-plan';

const mailBizWithScribe = buildSubscription({
    [PLANS.MAIL_BUSINESS]: 1,
    [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 4,
    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 5,
});

describe('SelectedPlan', () => {
    it.each([
        {
            planIDs: {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
            },
            expected: 4, // 2 members come from the plan and 2 from the addon
        },
    ])('should return the total members', ({ planIDs, expected }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getTotalMembers()).toBe(expected);
    });

    it.each([
        {
            planIDs: {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
            },
            expected: 4, // 2 users come from the plan and 2 from the addon
        },
    ])('should return the total users', ({ planIDs, expected }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getTotalUsers()).toBe(expected);
    });

    it.each([
        {
            planIDs: {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
            },
            expected: 5, // 1 ip from plan and 4 from the addon
        },
    ])('should return the total number of IPs', ({ planIDs, expected }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        expect(selectedPlan.getTotalIPs()).toBe(expected);
    });

    it.each([
        {
            planIDs: {
                [PLANS.BUNDLE_PRO_2024]: 1,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 5,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 4,
            },
            expected: 20, // 15 domains come from the plan and 5 from the addon
        },
    ])(`should return the total number of domains`, ({ planIDs, expected }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        expect(selectedPlan.getTotalDomains()).toBe(expected);
    });

    it.each([
        {
            planIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 4,
            },
            expected: 4,
        },
    ])('should return the total number of scribes', ({ planIDs, expected }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        expect(selectedPlan.getTotalScribes()).toBe(expected);
    });

    it.each([
        {
            planIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
            },
            expected: 4,
        },
        {
            planIDs: {
                [PLANS.DRIVE]: 1,
                [ADDON_NAMES.LUMO_DRIVE]: 4,
            },
            expected: 4,
        },
    ])('should return the total number of lumos', ({ planIDs, expected }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        expect(selectedPlan.getTotalLumos()).toBe(expected);
    });

    it.each([
        {
            planIDs: {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 3,
            },
            expected: PLANS.VPN_BUSINESS,
        },
    ])('should return plan name', ({ planIDs, expected }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getPlanName()).toBe(expected);
    });

    it.each([
        {
            selectedPlan: new SelectedPlan(
                {
                    [PLANS.VPN_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                    [ADDON_NAMES.IP_VPN_BUSINESS]: 3,
                },
                PLANS_MAP,
                CYCLE.MONTHLY,
                'EUR'
            ),
            expected: {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 3,
            },
        },
        {
            selectedPlan: SelectedPlan.createFromSubscription(mailBizWithScribe, PLANS_MAP),
            expected: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 4,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 5,
            },
        },
    ])('should return planIDs', ({ selectedPlan, expected }) => {
        expect(selectedPlan.planIDs).toEqual(expected);
    });

    it.each([
        {
            planIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
            },
            newScribeCount: 3,
            expectedPlanIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
            },
            newScribeCount: 1,
            expectedPlanIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 1,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
            },
            newScribeCount: 0,
            expectedPlanIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
            },
            newScribeCount: 4,
            expectedPlanIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 4,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
            },
            newScribeCount: 40,
            expectedPlanIDs: {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                // there can't be more scribe addons than total members in the org
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 4,
            },
        },
    ])('should update scribes count', ({ planIDs, newScribeCount, expectedPlanIDs }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const updatedSelectedPlan = selectedPlan.setScribeCount(newScribeCount);

        expect(updatedSelectedPlan.planIDs).toEqual(expectedPlanIDs);
    });

    it('should reduce the number of Scribe addons to the number of total members', () => {
        const planIDs = {
            [PLANS.MAIL_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 40,
        };

        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getTotalMembers()).toEqual(4);
        expect(selectedPlan.getTotalUsers()).toEqual(4);
        expect(selectedPlan.getTotalScribes()).toEqual(40);

        const newSelectedPlan = SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        expect(newSelectedPlan.getTotalScribes()).toEqual(4);

        expect(newSelectedPlan.planIDs).toEqual({
            [PLANS.MAIL_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 4,
        });
    });

    it.each([
        {
            planIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            },
            newLumoCount: 3,
            expectedPlanIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 3,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 3,
            },
            newLumoCount: 1,
            expectedPlanIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 1,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 3,
            },
            newLumoCount: 0,
            expectedPlanIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 3,
            },
            newLumoCount: 4,
            expectedPlanIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
            },
        },
        {
            planIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 3,
            },
            newLumoCount: 40,
            expectedPlanIDs: {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
                // there can't be more scribe addons than total members in the org
                [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
            },
        },
        {
            planIDs: {
                [PLANS.DRIVE]: 1,
                [ADDON_NAMES.LUMO_DRIVE]: 3,
            },
            newLumoCount: 40,
            expectedPlanIDs: {
                [PLANS.DRIVE]: 1,
                // default to 1 if there are no members and there are lumo addons
                [ADDON_NAMES.LUMO_DRIVE]: 1,
            },
        },
    ])('should update lumos count', ({ planIDs, newLumoCount, expectedPlanIDs }) => {
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const updatedSelectedPlan = selectedPlan.setLumoCount(newLumoCount);

        expect(updatedSelectedPlan.planIDs).toEqual(expectedPlanIDs);
    });

    it('should reduce the number of Lumo addons to the number of total members', () => {
        const planIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            [ADDON_NAMES.LUMO_MAIL_PRO]: 40,
        };

        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getTotalMembers()).toEqual(4);
        expect(selectedPlan.getTotalUsers()).toEqual(4);
        expect(selectedPlan.getTotalLumos()).toEqual(40);

        const newSelectedPlan = SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        expect(newSelectedPlan.getTotalLumos()).toEqual(4);

        expect(newSelectedPlan.planIDs).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            [ADDON_NAMES.LUMO_MAIL_PRO]: 4,
        });
    });

    it('should create copy', () => {
        const planIDs = {
            [PLANS.MAIL_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 4,
        };
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const updatedSelectedPlan = selectedPlan.setScribeCount(5);
        expect(updatedSelectedPlan).not.toBe(selectedPlan);
    });

    it('should not create copy', () => {
        const planIDs = {
            [PLANS.MAIL_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 4,
        };
        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const updatedSelectedPlan = selectedPlan.setScribeCount(4);
        expect(updatedSelectedPlan).toBe(selectedPlan);
    });

    describe('Free subscription', () => {
        it.each([FREE_SUBSCRIPTION, null, undefined])('should return default cycle and currency', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.cycle).toBe(CYCLE.MONTHLY);
            expect(selectedPlan.currency).toBe('EUR');
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return empty planIDs', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.planIDs).toEqual({});
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return 0 for total members', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.getTotalMembers()).toBe(0);
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return 1 for total users', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.getTotalUsers()).toBe(1);
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return 0 for total IPs', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.getTotalIPs()).toBe(0);
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return 0 for total domains', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.getTotalDomains()).toBe(0);
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return 0 for total scribes', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.getTotalScribes()).toBe(0);
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return plan name as PLANS.FREE', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.getPlanName()).toBe(PLANS.FREE);
        });

        it.each([FREE_SUBSCRIPTION, null, undefined])('should return FREE_PLAN', (subscription) => {
            const selectedPlan = SelectedPlan.createFromSubscription(subscription, PLANS_MAP);

            expect(selectedPlan.getPlan()).toEqual(FREE_PLAN);
        });
    });

    it('should return included and additional IPs - VPN_BUSINESS', () => {
        const planIDs = {
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
            [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
        };

        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getIncludedIPs()).toBe(1);
        expect(selectedPlan.getAdditionalIPs()).toBe(4);
        expect(selectedPlan.getTotalIPs()).toBe(5);
    });

    it('should return included and additional IPs - BUNDLE_PRO', () => {
        const planIDs = {
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 2,
            [ADDON_NAMES.IP_BUNDLE_PRO]: 4,
        };

        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getIncludedIPs()).toBe(0);
        expect(selectedPlan.getAdditionalIPs()).toBe(4);
        expect(selectedPlan.getTotalIPs()).toBe(4);
    });

    it('should return included and additional IPs - BUNDLE_PRO_2024', () => {
        const planIDs = {
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
        };

        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

        expect(selectedPlan.getIncludedIPs()).toBe(0);
        expect(selectedPlan.getAdditionalIPs()).toBe(4);
        expect(selectedPlan.getTotalIPs()).toBe(4);
    });

    it.each([{ [PLANS.VPN2024]: 1 }, { [PLANS.DRIVE]: 1 }])(
        'should return 1 for total users if there are no members',
        (planIDs) => {
            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

            expect(selectedPlan.getTotalUsers()).toBe(1);
        }
    );

    it('should change plan and its addons', () => {
        const planIDs = {
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 4,
        };

        const toPlan = PLANS.MAIL_PRO;

        const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
        const newSelectedPlan = selectedPlan.changePlan(toPlan);

        expect(newSelectedPlan.planIDs).toEqual({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
        });
    });

    describe('balancing scribes and lumos', () => {
        it('should balance scribes and lumos when total exceeds members (prefer-scribes)', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3, // Total members: 4
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 3, // Total scribes + lumos: 6
            };

            const selectedPlan = SelectedPlan.createNormalized(
                planIDs,
                PLANS_MAP,
                CYCLE.MONTHLY,
                'EUR',
                'prefer-scribes'
            );

            expect(selectedPlan.getTotalMembers()).toBe(4);
            expect(selectedPlan.getTotalScribes()).toBe(3);
            expect(selectedPlan.getTotalLumos()).toBe(1); // Lumos reduced by 2 to balance
            expect(selectedPlan.planIDs).toEqual({
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 1,
            });
        });

        it('should balance scribes and lumos when total exceeds members (prefer-lumos)', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3, // Total members: 4
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 3, // Total scribes + lumos: 6
            };

            const selectedPlan = SelectedPlan.createNormalized(
                planIDs,
                PLANS_MAP,
                CYCLE.MONTHLY,
                'EUR',
                'prefer-lumos'
            );

            expect(selectedPlan.getTotalMembers()).toBe(4);
            expect(selectedPlan.getTotalScribes()).toBe(1); // Scribes reduced by 2 to balance
            expect(selectedPlan.getTotalLumos()).toBe(3);
            expect(selectedPlan.planIDs).toEqual({
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 1,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 3,
            });
        });

        it('should balance scribes and lumos when total exceeds members (default prefer-lumos)', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3, // Total members: 4
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 3, // Total scribes + lumos: 6
            };

            const selectedPlan = SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');

            expect(selectedPlan.getTotalMembers()).toBe(4);
            expect(selectedPlan.getTotalScribes()).toBe(1); // Scribes reduced by 2 to balance
            expect(selectedPlan.getTotalLumos()).toBe(3);
            expect(selectedPlan.planIDs).toEqual({
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 1,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 3,
            });
        });

        it('should not balance when total scribes and lumos equal members', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3, // Total members: 4
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 2,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 2, // Total scribes + lumos: 4
            };

            const selectedPlan = SelectedPlan.createNormalized(
                planIDs,
                PLANS_MAP,
                CYCLE.MONTHLY,
                'EUR',
                'prefer-scribes'
            );

            expect(selectedPlan.getTotalMembers()).toBe(4);
            expect(selectedPlan.getTotalScribes()).toBe(2); // Unchanged
            expect(selectedPlan.getTotalLumos()).toBe(2); // Unchanged
            expect(selectedPlan.planIDs).toEqual(planIDs);
        });

        it('should not balance when total scribes and lumos less than members', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3, // Total members: 4
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 1,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 1, // Total scribes + lumos: 2
            };

            const selectedPlan = SelectedPlan.createNormalized(
                planIDs,
                PLANS_MAP,
                CYCLE.MONTHLY,
                'EUR',
                'prefer-scribes'
            );

            expect(selectedPlan.getTotalMembers()).toBe(4);
            expect(selectedPlan.getTotalScribes()).toBe(1); // Unchanged
            expect(selectedPlan.getTotalLumos()).toBe(1); // Unchanged
            expect(selectedPlan.planIDs).toEqual(planIDs);
        });

        it('should handle balancing when setting scribe count', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3, // Total members: 4
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 3,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const updatedPlan = selectedPlan.setScribeCount(3); // Adding 3 scribes when already have 3 lumos

            expect(updatedPlan.getTotalMembers()).toBe(4);
            expect(updatedPlan.getTotalScribes()).toBe(3);
            expect(updatedPlan.getTotalLumos()).toBe(1); // Lumos reduced to maintain balance
        });

        it('should handle balancing when setting lumo count', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3, // Total members: 4
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const updatedPlan = selectedPlan.setLumoCount(3); // Adding 3 lumos when already have 3 scribes

            expect(updatedPlan.getTotalMembers()).toBe(4);
            expect(updatedPlan.getTotalScribes()).toBe(1); // Scribes reduced to maintain balance
            expect(updatedPlan.getTotalLumos()).toBe(3);
        });
    });

    describe('getPresentAddonTypes', () => {
        it('should return empty object when no addons are present', () => {
            const planIDs = {
                [PLANS.MAIL_PRO]: 1,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({});
        });

        it('should return only member addon type when only member addons are present', () => {
            const planIDs = {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.MEMBER]: true,
            });
        });

        it('should return only domain addon type when only domain addons are present', () => {
            const planIDs = {
                [PLANS.BUNDLE_PRO_2024]: 1,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 2,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.DOMAIN]: true,
            });
        });

        it('should return only IP addon type when only IP addons are present', () => {
            const planIDs = {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.IP]: true,
            });
        });

        it('should return only scribe addon type when only scribe addons are present', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.SCRIBE]: true,
            });
        });

        it('should return only lumo addon type when only lumo addons are present', () => {
            const planIDs = {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.LUMO_MAIL_PRO]: 2,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.LUMO]: true,
            });
        });

        it('should return multiple addon types when different addon types are present', () => {
            const planIDs = {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                [ADDON_NAMES.IP_VPN_BUSINESS]: 3,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.MEMBER]: true,
                [ADDON_PREFIXES.IP]: true,
            });
        });

        it('should return all addon types when all addon types are present', () => {
            const planIDs = {
                [PLANS.BUNDLE_PRO_2024]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 2,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1,
                [ADDON_NAMES.IP_BUNDLE_PRO_2024]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024]: 1,
                [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.MEMBER]: true,
                [ADDON_PREFIXES.DOMAIN]: true,
                [ADDON_PREFIXES.IP]: true,
                [ADDON_PREFIXES.SCRIBE]: true,
                [ADDON_PREFIXES.LUMO]: true,
            });
        });

        it('should return the same addon type when multiple addons of the same type are present', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 2,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 1,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.MEMBER]: true,
                [ADDON_PREFIXES.SCRIBE]: true,
                [ADDON_PREFIXES.LUMO]: true,
            });
        });

        it('should work correctly with free plan (no addons)', () => {
            const selectedPlan = SelectedPlan.createFromSubscription(FREE_SUBSCRIPTION, PLANS_MAP);
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({});
        });

        it('should work correctly with complex business plan setup', () => {
            const planIDs = {
                [PLANS.MAIL_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 5,
                [ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS]: 3,
                [ADDON_NAMES.LUMO_MAIL_BUSINESS]: 2,
            };

            const selectedPlan = new SelectedPlan(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
            const result = selectedPlan.getPresentAddonTypes();

            expect(result).toEqual({
                [ADDON_PREFIXES.MEMBER]: true,
                [ADDON_PREFIXES.SCRIBE]: true,
                [ADDON_PREFIXES.LUMO]: true,
            });
        });
    });
});
