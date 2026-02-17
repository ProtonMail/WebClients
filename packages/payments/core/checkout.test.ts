import { addMonths } from '@proton/shared/lib/date-fns-utc';
import { PLANS_MAP } from '@proton/testing/data';

import { getCheckoutUi, getUsersAndAddons } from './checkout';
import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from './constants';
import type { Plan } from './plan/interface';
import { SubscriptionMode } from './subscription/constants';
import type { SubscriptionCheckResponse } from './subscription/interface';

const getPlan = (data: Partial<Plan>) => {
    return { ...data, Type: PLAN_TYPES.PLAN } as Plan;
};
const getAddon = (data: Partial<Plan>) => {
    return { ...data, Type: PLAN_TYPES.ADDON } as Plan;
};

// TODO add AI addon tests
const vpnPlan: Partial<Plan> = {
    Name: PLANS.VPN2024,
    Title: 'VPN',
    Pricing: {
        [CYCLE.MONTHLY]: 999,
        [CYCLE.YEARLY]: 7188,
        [CYCLE.FIFTEEN]: 14985,
        [CYCLE.TWO_YEARS]: 11976,
        [CYCLE.THIRTY]: 29970,
    },
    DefaultPricing: {
        [CYCLE.MONTHLY]: 999,
        [CYCLE.YEARLY]: 7188,
        [CYCLE.FIFTEEN]: 14985,
        [CYCLE.TWO_YEARS]: 11976,
        [CYCLE.THIRTY]: 29970,
    },
};

const visionaryPlan: Partial<Plan> = {
    Name: PLANS.VISIONARY,
    Title: 'VIS',
    MaxMembers: 6,
    Pricing: {
        [CYCLE.MONTHLY]: 2999,
        [CYCLE.YEARLY]: 28788,
        [CYCLE.TWO_YEARS]: 47976,
    },
    DefaultPricing: {
        [CYCLE.MONTHLY]: 2999,
        [CYCLE.YEARLY]: 28788,
        [CYCLE.TWO_YEARS]: 47976,
    },
};

const bundleProPlan: Partial<Plan> = {
    Name: PLANS.BUNDLE_PRO,
    Title: 'BUS',
    MaxMembers: 1,
    Pricing: {
        [CYCLE.MONTHLY]: 1299,
        [CYCLE.YEARLY]: 13188,
        [CYCLE.TWO_YEARS]: 23976,
    },
    DefaultPricing: {
        [CYCLE.MONTHLY]: 1299,
        [CYCLE.YEARLY]: 13188,
        [CYCLE.TWO_YEARS]: 23976,
    },
};

const bundleProMember: Partial<Plan> = {
    Name: ADDON_NAMES.MEMBER_BUNDLE_PRO,
    MaxMembers: 1,
    Pricing: {
        [CYCLE.MONTHLY]: 1299,
        [CYCLE.YEARLY]: 13188,
        [CYCLE.TWO_YEARS]: 23976,
    },
    DefaultPricing: {
        [CYCLE.MONTHLY]: 1299,
        [CYCLE.YEARLY]: 13188,
        [CYCLE.TWO_YEARS]: 23976,
    },
};

const bundleProDomain: Partial<Plan> = {
    Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO,
    MaxDomains: 1,
    Pricing: {
        [CYCLE.MONTHLY]: 150,
        [CYCLE.YEARLY]: 1680,
        [CYCLE.TWO_YEARS]: 3120,
    },
    DefaultPricing: {
        [CYCLE.MONTHLY]: 150,
        [CYCLE.YEARLY]: 1680,
        [CYCLE.TWO_YEARS]: 3120,
    },
};

const vpnProPlan = PLANS_MAP[PLANS.VPN_PRO] as Plan;

const vpnProMember = PLANS_MAP[ADDON_NAMES.MEMBER_VPN_PRO] as Plan;

const vpnBusinessPlan = PLANS_MAP[PLANS.VPN_BUSINESS] as Plan;

const vpnBusinessMember = PLANS_MAP[ADDON_NAMES.MEMBER_VPN_BUSINESS] as Plan;

describe('should get checkout result', () => {
    it('should calculate vpn2024', () => {
        const checkResult: SubscriptionCheckResponse = {
            Amount: 999,
            AmountDue: 999,
            Cycle: CYCLE.MONTHLY,
            Coupon: null,
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
        };

        expect(
            getCheckoutUi({
                planIDs: {
                    [PLANS.VPN2024]: 1,
                },
                checkResult,
                plansMap: {
                    [PLANS.VPN2024]: getPlan(vpnPlan),
                },
            })
        ).toEqual({
            regularAmountPerCycle: 999,
            regularAmountPerCycleOptimistic: 999,
            couponDiscount: undefined,
            planTitle: 'VPN',
            planIDs: { [PLANS.VPN2024]: 1 },
            planName: PLANS.VPN2024,
            usersTitle: '1 user',
            addons: [],
            withDiscountPerCycle: 999,
            withDiscountPerMonth: 999,
            withoutDiscountPerCycle: 999,
            withoutDiscountPerMonth: 999,
            discountPerCycle: 0,
            discountPercent: 0,
            membersPerMonth: 999,
            currency: 'USD',
            withDiscountMembersPerMonth: 999,
            withDiscountOneMemberPerMonth: 999,
            cycle: CYCLE.MONTHLY,
            renewCycle: CYCLE.MONTHLY,
            renewPrice: 999,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: 999,
            viewPricePerMonth: 999,
            monthlySuffix: '/month',
            checkResult,
        });
    });

    it('should correctly handle the price increases', () => {
        const checkResult: SubscriptionCheckResponse = {
            Amount: 1199,
            AmountDue: 1199,
            Cycle: CYCLE.MONTHLY,
            Coupon: null,
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
        };

        expect(
            getCheckoutUi({
                planIDs: {
                    [PLANS.VPN2024]: 1,
                },
                checkResult,
                plansMap: {
                    [PLANS.VPN2024]: {
                        ...getPlan(vpnPlan),
                        Pricing: {
                            // It's possible to create an offer that would INCREASE the price
                            [CYCLE.MONTHLY]: 1199,
                            [CYCLE.YEARLY]: 7188,
                            [CYCLE.FIFTEEN]: 14985,
                            [CYCLE.TWO_YEARS]: 11976,
                            [CYCLE.THIRTY]: 29970,
                        },
                        DefaultPricing: {
                            // And then the default price would be lower than the current price
                            [CYCLE.MONTHLY]: 999,
                            [CYCLE.YEARLY]: 7188,
                            [CYCLE.FIFTEEN]: 14985,
                            [CYCLE.TWO_YEARS]: 11976,
                            [CYCLE.THIRTY]: 29970,
                        },
                    },
                },
            })
        ).toEqual({
            regularAmountPerCycle: 1199,
            regularAmountPerCycleOptimistic: 1199,
            couponDiscount: undefined,
            planTitle: 'VPN',
            planName: PLANS.VPN2024,
            planIDs: { [PLANS.VPN2024]: 1 },
            usersTitle: '1 user',
            addons: [],
            // We don't want to show the price increase to the user, so we use the maximum of Pricing and
            // DefaultPricing as basis for the calculation. We go with Pricing in this case.
            withDiscountPerCycle: 1199,
            withDiscountPerMonth: 1199,
            withoutDiscountPerCycle: 1199,
            withoutDiscountPerMonth: 1199,
            discountPerCycle: 0,
            discountPercent: 0,
            membersPerMonth: 1199,
            currency: 'USD',
            withDiscountMembersPerMonth: 1199,
            withDiscountOneMemberPerMonth: 1199,
            cycle: CYCLE.MONTHLY,
            renewCycle: CYCLE.MONTHLY,
            renewPrice: 1199,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: 1199,
            viewPricePerMonth: 1199,
            monthlySuffix: '/month',
            checkResult,
        });
    });

    it('should calculate BF 24 month visionary', () => {
        const checkResult: SubscriptionCheckResponse = {
            Amount: 47976,
            AmountDue: 47976,
            CouponDiscount: -4776,
            Cycle: CYCLE.TWO_YEARS,
            Coupon: {
                Code: 'TEST',
                Description: '',
                MaximumRedemptionsPerUser: null,
            },
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.TWO_YEARS) / 1000,
        };

        expect(
            getCheckoutUi({
                planIDs: {
                    [PLANS.VISIONARY]: 1,
                },
                checkResult,
                plansMap: {
                    [PLANS.VISIONARY]: getPlan(visionaryPlan),
                },
            })
        ).toEqual({
            regularAmountPerCycle: 47976,
            regularAmountPerCycleOptimistic: 47976,
            couponDiscount: -4776,
            planIDs: { [PLANS.VISIONARY]: 1 },
            planTitle: 'VIS',
            planName: PLANS.VISIONARY,
            usersTitle: '6 users',
            addons: [],
            withDiscountPerCycle: 43200,
            withDiscountPerMonth: 1800,
            viewPricePerMonth: 1800,
            withoutDiscountPerCycle: 71976,
            withoutDiscountPerMonth: 2999,
            discountPerCycle: 28776,
            discountPercent: 40,
            membersPerMonth: 1999,
            currency: 'USD',
            withDiscountMembersPerMonth: 1800,
            withDiscountOneMemberPerMonth: 1800,
            cycle: CYCLE.TWO_YEARS,
            renewCycle: CYCLE.TWO_YEARS,
            renewPrice: 47976,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: 47976,
            monthlySuffix: '/month',
            checkResult,
        });
    });

    it('should calculate BF 30 month vpn2024', () => {
        const checkResult: SubscriptionCheckResponse = {
            Amount: 29970,
            AmountDue: 29970,
            CouponDiscount: -17994,
            Cycle: CYCLE.THIRTY,
            Coupon: {
                Code: 'TEST',
                Description: '',
                MaximumRedemptionsPerUser: null,
            },
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.THIRTY) / 1000,
        };

        const result = getCheckoutUi({
            planIDs: {
                [PLANS.VPN2024]: 1,
            },
            checkResult,
            plansMap: {
                [PLANS.VPN2024]: getPlan(vpnPlan),
            },
        });

        // Create a copy of the expected result with the approximate value
        const expected = {
            regularAmountPerCycle: 29970,
            regularAmountPerCycleOptimistic: 29970,
            couponDiscount: -17994,
            planTitle: 'VPN',
            planName: PLANS.VPN2024,
            planIDs: { [PLANS.VPN2024]: 1 },
            usersTitle: '1 user',
            addons: [],
            withDiscountPerCycle: 11976,
            withDiscountPerMonth: 399.2,
            viewPricePerMonth: 399.2,
            withoutDiscountPerCycle: 29970,
            withoutDiscountPerMonth: 999,
            discountPerCycle: 17994,
            discountPercent: 60,
            membersPerMonth: 999,
            currency: 'USD',
            withDiscountMembersPerMonth: 399.2,
            withDiscountOneMemberPerMonth: 399.2,
            cycle: CYCLE.THIRTY,
            renewCycle: CYCLE.THIRTY,
            renewPrice: 29970,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: 29970,
            monthlySuffix: '/month',
            checkResult,
        };

        // Use toBeCloseTo for the floating point value
        expect(result.withDiscountMembersPerMonth).toBeCloseTo(expected.withDiscountMembersPerMonth, 1);
        expect(result.withDiscountOneMemberPerMonth).toBeCloseTo(expected.withDiscountOneMemberPerMonth, 1);

        // For the rest of the object, we can delete the problematic property and compare the rest
        // Create copies with optional properties that can be deleted
        const resultCopy: Record<string, any> = { ...result };
        const expectedCopy: Record<string, any> = { ...expected };

        resultCopy.withDiscountMembersPerMonth = undefined;
        resultCopy.withDiscountOneMemberPerMonth = undefined;
        expectedCopy.withDiscountMembersPerMonth = undefined;
        expectedCopy.withDiscountOneMemberPerMonth = undefined;
        expect(resultCopy).toEqual(expectedCopy);
    });

    it('should calculate business with addons', () => {
        const checkResult: SubscriptionCheckResponse = {
            Amount: 81288,
            AmountDue: 81288,
            CouponDiscount: 0,
            Cycle: CYCLE.TWO_YEARS,
            Coupon: null,
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.TWO_YEARS) / 1000,
        };

        expect(
            getCheckoutUi({
                planIDs: {
                    [PLANS.BUNDLE_PRO]: 1,
                    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 2,
                    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 3,
                },
                checkResult,
                plansMap: {
                    [PLANS.BUNDLE_PRO]: getPlan(bundleProPlan),
                    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: getAddon(bundleProMember),
                    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: getAddon(bundleProDomain),
                },
            })
        ).toEqual({
            regularAmountPerCycle: 81288,
            regularAmountPerCycleOptimistic: 81288,
            couponDiscount: 0,
            planTitle: 'BUS',
            planName: PLANS.BUNDLE_PRO,
            planIDs: {
                [PLANS.BUNDLE_PRO]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 2,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 3,
            },
            usersTitle: '3 users',
            addons: [
                {
                    name: ADDON_NAMES.DOMAIN_BUNDLE_PRO,
                    quantity: 3,
                    title: '3 additional custom domains',
                    pricing: {
                        [CYCLE.MONTHLY]: 150,
                        [CYCLE.YEARLY]: 1680,
                        [CYCLE.TWO_YEARS]: 3120,
                    },
                },
            ],
            withDiscountPerCycle: 81288,
            withDiscountPerMonth: 3387,
            withoutDiscountPerCycle: 104328,
            withoutDiscountPerMonth: 4347,
            discountPerCycle: 23040,
            discountPercent: 22,
            membersPerMonth: 2997,
            currency: 'USD',
            withDiscountMembersPerMonth: 2997,
            withDiscountOneMemberPerMonth: 999,
            viewPricePerMonth: 999,
            cycle: CYCLE.TWO_YEARS,
            renewCycle: CYCLE.TWO_YEARS,
            renewPrice: 81288,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: 81288,
            monthlySuffix: '/user per month',
            checkResult,
        });
    });

    it('should calculate VPN PRO with addons', () => {
        const twoYearPrice3Members =
            (vpnProPlan.Pricing?.[CYCLE.TWO_YEARS] || 0) + (vpnProMember.Pricing?.[CYCLE.TWO_YEARS] || 0) * 2;

        const cost24MonthlyCycles3Members =
            (vpnProPlan.Pricing?.[CYCLE.MONTHLY] || 0) * 24 + (vpnProMember.Pricing?.[CYCLE.MONTHLY] || 0) * 24 * 2;

        const checkResult: SubscriptionCheckResponse = {
            Amount: twoYearPrice3Members,
            AmountDue: twoYearPrice3Members,
            CouponDiscount: 0,
            Cycle: CYCLE.TWO_YEARS,
            Coupon: null,
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.TWO_YEARS) / 1000,
        };

        expect(
            getCheckoutUi({
                planIDs: {
                    [PLANS.VPN_PRO]: 1,
                    [ADDON_NAMES.MEMBER_VPN_PRO]: 2,
                },
                checkResult,
                plansMap: {
                    [PLANS.VPN_PRO]: getPlan(vpnProPlan),
                    [ADDON_NAMES.MEMBER_VPN_PRO]: getAddon(vpnProMember),
                },
            })
        ).toEqual({
            regularAmountPerCycle: twoYearPrice3Members,
            regularAmountPerCycleOptimistic: twoYearPrice3Members,
            couponDiscount: 0,
            planTitle: 'VPN Essentials',
            planName: PLANS.VPN_PRO,
            planIDs: {
                [PLANS.VPN_PRO]: 1,
                [ADDON_NAMES.MEMBER_VPN_PRO]: 2,
            },
            usersTitle: '4 users',
            addons: [],
            withDiscountPerCycle: twoYearPrice3Members,
            withDiscountPerMonth: twoYearPrice3Members / 24,
            withoutDiscountPerCycle: cost24MonthlyCycles3Members,
            withoutDiscountPerMonth: 3596,
            discountPerCycle: cost24MonthlyCycles3Members - twoYearPrice3Members,
            discountPercent: 33,
            membersPerMonth: twoYearPrice3Members / 24,
            currency: 'USD',
            withDiscountMembersPerMonth: twoYearPrice3Members / 24,
            withDiscountOneMemberPerMonth: 599,
            viewPricePerMonth: 599,
            cycle: CYCLE.TWO_YEARS,
            renewCycle: CYCLE.TWO_YEARS,
            renewPrice: twoYearPrice3Members,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: twoYearPrice3Members,
            monthlySuffix: '/user per month',
            checkResult,
        });
    });

    it('should calculate VPN Business with addons', () => {
        const twoYearPrice3Members =
            (vpnBusinessPlan.Pricing?.[CYCLE.TWO_YEARS] || 0) + (vpnBusinessMember.Pricing?.[CYCLE.TWO_YEARS] || 0) * 2;

        const cost24MonthlyCycles3Members =
            (vpnBusinessPlan.Pricing?.[CYCLE.MONTHLY] || 0) * 24 +
            (vpnBusinessMember.Pricing?.[CYCLE.MONTHLY] || 0) * 24 * 2;

        const checkResult: SubscriptionCheckResponse = {
            Amount: twoYearPrice3Members,
            AmountDue: twoYearPrice3Members,
            CouponDiscount: 0,
            Cycle: CYCLE.TWO_YEARS,
            Coupon: null,
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.TWO_YEARS) / 1000,
        };

        expect(
            getCheckoutUi({
                planIDs: {
                    [PLANS.VPN_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                },
                checkResult,

                plansMap: {
                    [PLANS.VPN_BUSINESS]: getPlan(vpnBusinessPlan),
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: getAddon(vpnBusinessMember),
                },
            })
        ).toEqual({
            regularAmountPerCycle: twoYearPrice3Members,
            regularAmountPerCycleOptimistic: twoYearPrice3Members,
            couponDiscount: 0,
            planIDs: {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
            },
            planTitle: 'VPN Professional',
            planName: PLANS.VPN_BUSINESS,
            usersTitle: '4 users',
            addons: [
                {
                    name: ADDON_NAMES.IP_VPN_BUSINESS,
                    quantity: 1,
                    pricing: { 1: 4999, 12: 47988, 24: 86376 },
                    title: '1 server',
                },
            ],
            withDiscountPerCycle: twoYearPrice3Members,
            withDiscountPerMonth: twoYearPrice3Members / 24,
            withoutDiscountPerCycle: cost24MonthlyCycles3Members,
            withoutDiscountPerMonth: 9795,
            discountPerCycle: cost24MonthlyCycles3Members - twoYearPrice3Members,
            discountPercent: 27,
            membersPerMonth: 3596,
            currency: 'USD',
            withDiscountMembersPerMonth: 3596,
            withDiscountOneMemberPerMonth: 899,
            viewPricePerMonth: 899,
            cycle: CYCLE.TWO_YEARS,
            renewCycle: CYCLE.TWO_YEARS,
            renewPrice: twoYearPrice3Members,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: twoYearPrice3Members,
            monthlySuffix: '/user per month',
            checkResult,
        });
    });

    it('should calculate 100% discount', () => {
        const checkResult: SubscriptionCheckResponse = {
            Amount: 47976,
            AmountDue: 0,
            CouponDiscount: -47976,
            Cycle: CYCLE.TWO_YEARS,
            Coupon: {
                Code: 'TEST',
                Description: '',
                MaximumRedemptionsPerUser: null,
            },
            Currency: 'USD',
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: +addMonths(new Date(), CYCLE.TWO_YEARS) / 1000,
        };

        expect(
            getCheckoutUi({
                planIDs: {
                    [PLANS.VISIONARY]: 1,
                },
                checkResult,
                plansMap: {
                    [PLANS.VISIONARY]: getPlan(visionaryPlan),
                },
            })
        ).toEqual({
            regularAmountPerCycle: 47976,
            regularAmountPerCycleOptimistic: 47976,
            couponDiscount: -47976,
            planTitle: 'VIS',
            planIDs: {
                [PLANS.VISIONARY]: 1,
            },
            planName: PLANS.VISIONARY,
            usersTitle: '6 users',
            addons: [],
            withDiscountPerCycle: 0,
            withDiscountPerMonth: 0,
            withoutDiscountPerCycle: 71976,
            withoutDiscountPerMonth: 2999,
            discountPerCycle: 71976,
            discountPercent: 100,
            membersPerMonth: 1999,
            currency: 'USD',
            withDiscountMembersPerMonth: 0,
            withDiscountOneMemberPerMonth: 0,
            cycle: CYCLE.TWO_YEARS,
            renewCycle: CYCLE.TWO_YEARS,
            renewPrice: 47976,
            renewCycleOverriden: false,
            renewPriceOverriden: false,
            amountDue: 0,
            viewPricePerMonth: 0,
            monthlySuffix: '/month',
            checkResult,
        });
    });

    it('should compute discount percent correctly for custom billing mode with addon (Pass + Lumo)', () => {
        const result = getCheckoutUi({
            planIDs: {
                [PLANS.PASS]: 1,
                [ADDON_NAMES.LUMO_PASS]: 1,
            },
            checkResult: {
                Amount: 11988,
                AmountDue: 11988,
                Cycle: CYCLE.YEARLY,
                Coupon: null,
                Currency: 'USD',
                SubscriptionMode: SubscriptionMode.CustomBillings,
                BaseRenewAmount: null,
                RenewCycle: null,
                PeriodEnd: +addMonths(new Date(), CYCLE.YEARLY) / 1000,
            },
            plansMap: {
                [PLANS.PASS]: PLANS_MAP[PLANS.PASS],
                [ADDON_NAMES.LUMO_PASS]: PLANS_MAP[ADDON_NAMES.LUMO_PASS],
            },
        });

        expect(result.discountPercent).toBe(28);
    });

    describe('viewPricePerMonth', () => {
        it('should show price per member without discounts: plan with member addons', () => {
            const checkResult: SubscriptionCheckResponse = {
                Amount: 129528,
                Currency: 'EUR',
                AmountDue: 97146,
                Proration: 0,
                CouponDiscount: -32382,
                Gift: 0,
                Credit: 0,
                UnusedCredit: 0,
                Coupon: {
                    Code: 'TEST25',
                    Description: '25% discount',
                    MaximumRedemptionsPerUser: null,
                },
                Cycle: 24,
                SubscriptionMode: 0,
                TaxInclusive: 1,
                Taxes: [
                    {
                        Name: 'VAT - Export from Switzerland',
                        Rate: 0,
                        Amount: 0,
                    },
                ],
                BaseRenewAmount: null,
                RenewCycle: null,
                PeriodEnd: +addMonths(new Date(), 24) / 1000,
            };

            expect(
                getCheckoutUi({
                    planIDs: {
                        [PLANS.VPN_BUSINESS]: 1,
                    },
                    checkResult,
                    plansMap: PLANS_MAP,
                })
            ).toEqual({
                regularAmountPerCycle: 129528,
                regularAmountPerCycleOptimistic: 129528,
                viewPricePerMonth: 899,
                amountDue: 97146,
                couponDiscount: -32382,
                cycle: 24,
                currency: 'EUR',
                discountPercent: 45,
                discountPerCycle: 80382,
                membersPerMonth: 1798,
                planIDs: {
                    [PLANS.VPN_BUSINESS]: 1,
                },
                planName: PLANS.VPN_BUSINESS,
                planTitle: 'VPN Professional',
                usersTitle: '2 users',
                renewCycle: 24,
                renewPrice: 129528,
                renewCycleOverriden: false,
                renewPriceOverriden: false,
                withDiscountPerCycle: 97146,

                withDiscountMembersPerMonth: 448.75,
                withDiscountOneMemberPerMonth: 224.375,
                withDiscountPerMonth: 4047.75,
                withoutDiscountPerCycle: 177528,
                withoutDiscountPerMonth: 7397,
                addons: [
                    {
                        name: ADDON_NAMES.IP_VPN_BUSINESS,
                        pricing: { 1: 4999, 12: 47988, 24: 86376 },
                        quantity: 1,
                        title: '1 server',
                    },
                ],
                monthlySuffix: '/user per month',
                checkResult,
            });
        });

        // it('should show price per member with discounts: plan without member addons');
    });
});

describe('getUsersAndAddons()', () => {
    it('should return plan name and number of users', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN2024]: 1,
                },
                {
                    [PLANS.VPN2024]: getPlan(vpnPlan),
                }
            )
        ).toEqual({
            planName: PLANS.VPN2024,
            planTitle: 'VPN',
            users: 1,
            viewUsers: 1,
            usersPricing: {
                [CYCLE.MONTHLY]: 999,
                [CYCLE.YEARLY]: 7188,
                [CYCLE.FIFTEEN]: 14985,
                [CYCLE.TWO_YEARS]: 11976,
                [CYCLE.THIRTY]: 29970,
            },
            addons: [],
        });
    });

    it('should return plan name and number of users - family plan', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.FAMILY]: 1,
                },
                {
                    [PLANS.FAMILY]: PLANS_MAP[PLANS.FAMILY],
                }
            )
        ).toEqual({
            planName: PLANS.FAMILY,
            planTitle: 'Proton Family',
            // we have 1 user for price calculation purpos
            users: 1,
            // and we display 6 users in the checkout modal
            viewUsers: 6,
            // even though there are 6 users, we don't divide the price by 6 for family plan. That's intentional.
            usersPricing: {
                [CYCLE.MONTHLY]: 2999,
                [CYCLE.YEARLY]: 28788,
                [CYCLE.TWO_YEARS]: 47976,
            },
            addons: [],
        });
    });

    it('should return plan name and number of users - VPN Essentials', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN_PRO]: 1,
                },
                {
                    [PLANS.VPN_PRO]: PLANS_MAP[PLANS.VPN_PRO],
                    [ADDON_NAMES.MEMBER_VPN_PRO]: PLANS_MAP[ADDON_NAMES.MEMBER_VPN_PRO],
                }
            )
        ).toEqual({
            planName: PLANS.VPN_PRO,
            planTitle: 'VPN Essentials',
            // VPN Essentials has 2 users by default
            users: 2,
            viewUsers: 2,
            usersPricing: {
                [CYCLE.MONTHLY]: 899,
                [CYCLE.YEARLY]: 8388,
                [CYCLE.TWO_YEARS]: 14376,
            },
            addons: [],
        });
    });

    it('should return plan name and number of users - VPN Essentials with addons', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN_PRO]: 1,
                    [ADDON_NAMES.MEMBER_VPN_PRO]: 4,
                },
                {
                    [PLANS.VPN_PRO]: PLANS_MAP[PLANS.VPN_PRO],
                    [ADDON_NAMES.MEMBER_VPN_PRO]: PLANS_MAP[ADDON_NAMES.MEMBER_VPN_PRO],
                }
            )
        ).toEqual({
            planName: PLANS.VPN_PRO,
            planTitle: 'VPN Essentials',
            // VPN Essentials has 2 users by default + 4 addons selected by user
            users: 6,
            viewUsers: 6,
            usersPricing: {
                [CYCLE.MONTHLY]: 899,
                [CYCLE.YEARLY]: 8388,
                [CYCLE.TWO_YEARS]: 14376,
            },
            addons: [],
        });
    });

    it('should return plan name and number of users - VPN Professional', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN_BUSINESS]: 1,
                },
                {
                    [PLANS.VPN_BUSINESS]: PLANS_MAP[PLANS.VPN_BUSINESS],
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.MEMBER_VPN_BUSINESS],
                    [ADDON_NAMES.IP_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.IP_VPN_BUSINESS],
                }
            )
        ).toEqual({
            planName: PLANS.VPN_BUSINESS,
            planTitle: 'VPN Professional',
            // VPN Professional has 2 users by default
            users: 2,
            viewUsers: 2,
            usersPricing: {
                [CYCLE.MONTHLY]: 1199,
                [CYCLE.YEARLY]: 11988,
                [CYCLE.TWO_YEARS]: 21576,
            },
            addons: [
                // Yes, there must be addon even though the user didn't specify them. Because for price calculation
                // purposes we must take into account the fact that VPN Professional has 2 members + 1 server by default
                {
                    name: ADDON_NAMES.IP_VPN_BUSINESS,
                    title: '1 server',
                    quantity: 1,
                    pricing: { 1: 4999, 12: 47988, 24: 86376 },
                },
            ],
        });
    });

    it('should return plan name and number of users - VPN Professional with users', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 4,
                },
                {
                    [PLANS.VPN_BUSINESS]: PLANS_MAP[PLANS.VPN_BUSINESS],
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.MEMBER_VPN_BUSINESS],
                    [ADDON_NAMES.IP_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.IP_VPN_BUSINESS],
                }
            )
        ).toEqual({
            planName: PLANS.VPN_BUSINESS,
            planTitle: 'VPN Professional',
            // VPN Professional has 2 users by default + 4 addons selected by user
            users: 6,
            viewUsers: 6,
            usersPricing: {
                [CYCLE.MONTHLY]: 1199,
                [CYCLE.YEARLY]: 11988,
                [CYCLE.TWO_YEARS]: 21576,
            },
            addons: [
                // Yes, there must be addon even though the user didn't specify them. Because for price calculation
                // purposes we must take into account the fact that VPN Professional has 2 members + 1 server by default
                {
                    name: ADDON_NAMES.IP_VPN_BUSINESS,
                    title: '1 server',
                    quantity: 1,
                    pricing: { 1: 4999, 12: 47988, 24: 86376 },
                },
            ],
        });
    });

    it('should return plan name and number of users - VPN Professional with IPs', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN_BUSINESS]: 1,
                    [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
                },
                {
                    [PLANS.VPN_BUSINESS]: PLANS_MAP[PLANS.VPN_BUSINESS],
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.MEMBER_VPN_BUSINESS],
                    [ADDON_NAMES.IP_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.IP_VPN_BUSINESS],
                }
            )
        ).toEqual({
            planName: PLANS.VPN_BUSINESS,
            planTitle: 'VPN Professional',
            // VPN Professional has 2 users by default
            users: 2,
            viewUsers: 2,
            usersPricing: {
                [CYCLE.MONTHLY]: 1199,
                [CYCLE.YEARLY]: 11988,
                [CYCLE.TWO_YEARS]: 21576,
            },
            addons: [
                {
                    // Yes, there must be 5 addons instead of 4 that were specified by user.
                    // See the comments in the other tests.
                    name: ADDON_NAMES.IP_VPN_BUSINESS,
                    quantity: 5,
                    pricing: { 1: 4999, 12: 47988, 24: 86376 },
                    title: '5 servers',
                },
            ],
        });
    });

    it('should return plan name and number of users - VPN Professional with users and IPs', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 4,
                    [ADDON_NAMES.IP_VPN_BUSINESS]: 4,
                },
                {
                    [PLANS.VPN_BUSINESS]: PLANS_MAP[PLANS.VPN_BUSINESS],
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.MEMBER_VPN_BUSINESS],
                    [ADDON_NAMES.IP_VPN_BUSINESS]: PLANS_MAP[ADDON_NAMES.IP_VPN_BUSINESS],
                }
            )
        ).toEqual({
            planName: PLANS.VPN_BUSINESS,
            planTitle: 'VPN Professional',
            // VPN Professional has 2 users by default + 4 addons selected by user
            users: 6,
            viewUsers: 6,
            usersPricing: {
                [CYCLE.MONTHLY]: 1199,
                [CYCLE.YEARLY]: 11988,
                [CYCLE.TWO_YEARS]: 21576,
            },
            addons: [
                {
                    // Yes, there must be 5 addons instead of 4 that were specified by user.
                    // See the comments in the other tests.
                    name: ADDON_NAMES.IP_VPN_BUSINESS,
                    quantity: 5,
                    pricing: { 1: 4999, 12: 47988, 24: 86376 },
                    title: '5 servers',
                },
            ],
        });
    });

    it('should return plan name and number of users - VPN and Pass Professional with users', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN_PASS_BUNDLE_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS]: 4,
                },
                {
                    [PLANS.VPN_PASS_BUNDLE_BUSINESS]: PLANS_MAP[PLANS.VPN_PASS_BUNDLE_BUSINESS],
                    [ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS]:
                        PLANS_MAP[ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS],
                    [ADDON_NAMES.IP_VPN_PASS_BUNDLE_BUSINESS]: PLANS_MAP[ADDON_NAMES.IP_VPN_PASS_BUNDLE_BUSINESS],
                }
            )
        ).toEqual({
            planName: PLANS.VPN_PASS_BUNDLE_BUSINESS,
            planTitle: 'VPN and Pass Professional',
            // VPN and Pass Professional has 1 user by default + 4 addons selected by user
            users: 5,
            viewUsers: 5,
            usersPricing: {
                [CYCLE.MONTHLY]: 1299,
                [CYCLE.YEARLY]: 13188,
                [CYCLE.TWO_YEARS]: 0,
            },
            addons: [],
        });
    });
});
