import { type Subscription } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { PLANS_MAP } from '@proton/testing/data';

import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS } from '../constants';
import { SelectedPlan } from './selected-plan';

const mailBizWithScribe: Subscription = {
    ID: 'V4x-xzsnFllQ-6KrnqoPqB-i4ImclWIri-a_TtpE0e42oF_rVqK5CPBbgKKzj2wPBc5vwurfldYvxlD0K8XVyg==',
    Cycle: 12,
    PeriodStart: 1718720116,
    PeriodEnd: 1750256116,
    CreateTime: 1718720116,
    CouponCode: null,
    Currency: 'CHF',
    Amount: 109935,
    Discount: 0,
    RenewDiscount: 0,
    RenewAmount: 109935,
    InvoiceID: '12345',
    Plans: [
        {
            ID: 'EyTu5rJgeiYwm-m7S23393TuT1Ag9tP5ucClCOVAYe5C7cW6G7arS3eE_n3KBecCBwWJuHfCSBqBbiny-TH6-Q==',
            Type: 1,
            Name: PLANS.MAIL_BUSINESS,
            Title: 'Mail Professional',
            MaxDomains: 10,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 53687091200,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 11988,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'HYm8cOa_XTtYrbv0TqkaineQ7XqM93JgP1fveFfLeyVK4wgFAUMCgSm43iisgKzdlKSB8Nl2_jvCrZEEb8Z9_Q==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_MAIL_BUSINESS,
            Title: '+1 User',
            MaxDomains: 0,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 53687091200,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 11988,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'HYm8cOa_XTtYrbv0TqkaineQ7XqM93JgP1fveFfLeyVK4wgFAUMCgSm43iisgKzdlKSB8Nl2_jvCrZEEb8Z9_Q==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_MAIL_BUSINESS,
            Title: '+1 User',
            MaxDomains: 0,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 53687091200,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 11988,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'HYm8cOa_XTtYrbv0TqkaineQ7XqM93JgP1fveFfLeyVK4wgFAUMCgSm43iisgKzdlKSB8Nl2_jvCrZEEb8Z9_Q==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_MAIL_BUSINESS,
            Title: '+1 User',
            MaxDomains: 0,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 53687091200,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 11988,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'HYm8cOa_XTtYrbv0TqkaineQ7XqM93JgP1fveFfLeyVK4wgFAUMCgSm43iisgKzdlKSB8Nl2_jvCrZEEb8Z9_Q==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_MAIL_BUSINESS,
            Title: '+1 User',
            MaxDomains: 0,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 53687091200,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 11988,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'azQV8XsiGL5pJOAIGoGXaBt7SFZ2E6k9fNju3NYNairJtGS4szGUmnKFA0_5CTphLU2H7aNLG4X-UvAOrVvnMA==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS,
            Title: '+1 Scribe Seat',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 8,
            Features: 0,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 9999,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'azQV8XsiGL5pJOAIGoGXaBt7SFZ2E6k9fNju3NYNairJtGS4szGUmnKFA0_5CTphLU2H7aNLG4X-UvAOrVvnMA==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS,
            Title: '+1 Scribe Seat',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 8,
            Features: 0,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 9999,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'azQV8XsiGL5pJOAIGoGXaBt7SFZ2E6k9fNju3NYNairJtGS4szGUmnKFA0_5CTphLU2H7aNLG4X-UvAOrVvnMA==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS,
            Title: '+1 Scribe Seat',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 8,
            Features: 0,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 9999,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'azQV8XsiGL5pJOAIGoGXaBt7SFZ2E6k9fNju3NYNairJtGS4szGUmnKFA0_5CTphLU2H7aNLG4X-UvAOrVvnMA==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS,
            Title: '+1 Scribe Seat',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 8,
            Features: 0,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 9999,
            Offer: 'default',
            Quantity: 1,
        },
        {
            ID: 'azQV8XsiGL5pJOAIGoGXaBt7SFZ2E6k9fNju3NYNairJtGS4szGUmnKFA0_5CTphLU2H7aNLG4X-UvAOrVvnMA==',
            Type: 0,
            Name: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS,
            Title: '+1 Scribe Seat',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 8,
            Features: 0,
            State: 1,
            Cycle: 12,
            Currency: 'CHF',
            Amount: 9999,
            Offer: 'default',
            Quantity: 1,
        },
    ],
    Renew: 1,
    External: 0,
    BillingPlatform: 1,
    IsTrial: false,
};

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

        const newSelectedPlan = selectedPlan.applyRules();
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

        const newSelectedPlan = selectedPlan.applyRules();
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

    it.each([{ [PLANS.VPN]: 1 }, { [PLANS.DRIVE]: 1 }])(
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
});
