import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { getCheckout, getUsersAndAddons } from '@proton/shared/lib/helpers/checkout';
import { PLANS_MAP } from '@proton/testing/data';

import type { Plan } from '../../lib/interfaces';

const getPlan = (data: Partial<Plan>) => {
    return { ...data, Type: PLAN_TYPES.PLAN } as Plan;
};
const getAddon = (data: Partial<Plan>) => {
    return { ...data, Type: PLAN_TYPES.ADDON } as Plan;
};

// TODO add AI addon tests
const vpnPlan: Partial<Plan> = {
    Name: PLANS.VPN,
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
    it('should calculate vpn plus', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VPN]: 1,
                },
                checkResult: {
                    Amount: 999,
                    AmountDue: 999,
                    Cycle: CYCLE.MONTHLY,
                    Coupon: null,
                    Currency: 'USD',
                },
                plansMap: {
                    [PLANS.VPN]: getPlan(vpnPlan),
                },
            })
        ).toEqual({
            couponDiscount: undefined,
            planTitle: 'VPN',
            planIDs: { [PLANS.VPN]: 1 },
            planName: PLANS.VPN,
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
        });
    });

    it('should correctly handle the price increases', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VPN]: 1,
                },
                checkResult: {
                    Amount: 1199,
                    AmountDue: 1199,
                    Cycle: CYCLE.MONTHLY,
                    Coupon: null,
                    Currency: 'USD',
                },
                plansMap: {
                    [PLANS.VPN]: {
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
            couponDiscount: undefined,
            planTitle: 'VPN',
            planName: PLANS.VPN,
            planIDs: { [PLANS.VPN]: 1 },
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
        });
    });

    it('should correctly handle the price decrease', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VPN]: 1,
                },
                checkResult: {
                    Amount: 799,
                    AmountDue: 799,
                    Cycle: CYCLE.MONTHLY,
                    Coupon: null,
                    Currency: 'USD',
                },
                plansMap: {
                    [PLANS.VPN]: {
                        ...getPlan(vpnPlan),
                        Pricing: {
                            // It's possible to create an offer that would decrease the price
                            [CYCLE.MONTHLY]: 799,
                            [CYCLE.YEARLY]: 7188,
                            [CYCLE.FIFTEEN]: 14985,
                            [CYCLE.TWO_YEARS]: 11976,
                            [CYCLE.THIRTY]: 29970,
                        },
                        DefaultPricing: {
                            // And then the default price would be higher than the current price
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
            couponDiscount: undefined,
            planTitle: 'VPN',
            planName: PLANS.VPN,
            planIDs: { [PLANS.VPN]: 1 },
            usersTitle: '1 user',
            addons: [],
            withDiscountPerCycle: 799,
            withDiscountPerMonth: 799,
            withoutDiscountPerCycle: 799,
            withoutDiscountPerMonth: 999,
            discountPerCycle: 200,
            discountPercent: 20,
            membersPerMonth: 799,
            currency: 'USD',
        });
    });

    it('should calculate bf 24 month visionary', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VISIONARY]: 1,
                },
                checkResult: {
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
                },
                plansMap: {
                    [PLANS.VISIONARY]: getPlan(visionaryPlan),
                },
            })
        ).toEqual({
            couponDiscount: -4776,
            planIDs: { [PLANS.VISIONARY]: 1 },
            planTitle: 'VIS',
            planName: PLANS.VISIONARY,
            usersTitle: '6 users',
            addons: [],
            withDiscountPerCycle: 43200,
            withDiscountPerMonth: 1800,
            withoutDiscountPerCycle: 47976,
            withoutDiscountPerMonth: 2999,
            discountPerCycle: 28776,
            discountPercent: 40,
            membersPerMonth: 1999,
            currency: 'USD',
        });
    });

    it('should calculate bf 30 month vpn plus', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VPN]: 1,
                },
                checkResult: {
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
                },
                plansMap: {
                    [PLANS.VPN]: getPlan(vpnPlan),
                },
            })
        ).toEqual({
            couponDiscount: -17994,
            planTitle: 'VPN',
            planName: PLANS.VPN,
            planIDs: { [PLANS.VPN]: 1 },
            usersTitle: '1 user',
            addons: [],
            withDiscountPerCycle: 11976,
            withDiscountPerMonth: 399.2,
            withoutDiscountPerCycle: 29970,
            withoutDiscountPerMonth: 999,
            discountPerCycle: 17994,
            discountPercent: 60,
            membersPerMonth: 999,
            currency: 'USD',
        });
    });

    it('should calculate business with addons', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.BUNDLE_PRO]: 1,
                    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 2,
                    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 3,
                },
                checkResult: {
                    Amount: 81288,
                    AmountDue: 81288,
                    CouponDiscount: 0,
                    Cycle: CYCLE.TWO_YEARS,
                    Coupon: null,
                    Currency: 'USD',
                },
                plansMap: {
                    [PLANS.BUNDLE_PRO]: getPlan(bundleProPlan),
                    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: getAddon(bundleProMember),
                    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: getAddon(bundleProDomain),
                },
            })
        ).toEqual({
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
            withoutDiscountPerCycle: 81288,
            withoutDiscountPerMonth: 4347,
            discountPerCycle: 23040,
            discountPercent: 22,
            membersPerMonth: 2997,
            currency: 'USD',
        });
    });

    it('should calculate VPN PRO with addons', () => {
        const twoYearPrice3Members =
            (vpnProPlan.Pricing?.[CYCLE.TWO_YEARS] || 0) + (vpnProMember.Pricing?.[CYCLE.TWO_YEARS] || 0) * 2;

        const cost24MonthlyCycles3Members =
            (vpnProPlan.Pricing?.[CYCLE.MONTHLY] || 0) * 24 + (vpnProMember.Pricing?.[CYCLE.MONTHLY] || 0) * 24 * 2;

        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VPN_PRO]: 1,
                    [ADDON_NAMES.MEMBER_VPN_PRO]: 2,
                },
                checkResult: {
                    Amount: twoYearPrice3Members,
                    AmountDue: twoYearPrice3Members,
                    CouponDiscount: 0,
                    Cycle: CYCLE.TWO_YEARS,
                    Coupon: null,
                    Currency: 'USD',
                },
                plansMap: {
                    [PLANS.VPN_PRO]: getPlan(vpnProPlan),
                    [ADDON_NAMES.MEMBER_VPN_PRO]: getAddon(vpnProMember),
                },
            })
        ).toEqual({
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
            withoutDiscountPerCycle: twoYearPrice3Members,
            withoutDiscountPerMonth: 3596,
            discountPerCycle: cost24MonthlyCycles3Members - twoYearPrice3Members,
            discountPercent: 33,
            membersPerMonth: twoYearPrice3Members / 24,
            currency: 'USD',
        });
    });

    xit('should calculate VPN Business with addons', () => {
        const twoYearPrice3Members =
            (vpnBusinessPlan.Pricing?.[CYCLE.TWO_YEARS] || 0) + (vpnBusinessMember.Pricing?.[CYCLE.TWO_YEARS] || 0) * 2;

        const cost24MonthlyCycles3Members =
            (vpnBusinessPlan.Pricing?.[CYCLE.MONTHLY] || 0) * 24 +
            (vpnBusinessMember.Pricing?.[CYCLE.MONTHLY] || 0) * 24 * 2;

        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VPN_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
                },
                checkResult: {
                    Amount: twoYearPrice3Members,
                    AmountDue: twoYearPrice3Members,
                    CouponDiscount: 0,
                    Cycle: CYCLE.TWO_YEARS,
                    Coupon: null,
                    Currency: 'USD',
                },
                plansMap: {
                    [PLANS.VPN_BUSINESS]: getPlan(vpnBusinessPlan),
                    [ADDON_NAMES.MEMBER_VPN_BUSINESS]: getAddon(vpnBusinessMember),
                },
            })
        ).toEqual({
            couponDiscount: 0,
            planIDs: {
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 2,
            },
            planTitle: 'VPN Business',
            planName: PLANS.VPN_BUSINESS,
            usersTitle: '3 users',
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
            withoutDiscountPerCycle: twoYearPrice3Members,
            withoutDiscountPerMonth: 1800,
            discountPerCycle: cost24MonthlyCycles3Members - twoYearPrice3Members,
            discountPercent: 17,
            membersPerMonth: twoYearPrice3Members / 24,
            currency: 'USD',
        });
    });

    it('should calculate 100% discount', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.VISIONARY]: 1,
                },
                checkResult: {
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
                },
                plansMap: {
                    [PLANS.VISIONARY]: getPlan(visionaryPlan),
                },
            })
        ).toEqual({
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
            withoutDiscountPerCycle: 47976,
            withoutDiscountPerMonth: 2999,
            discountPerCycle: 71976,
            discountPercent: 100,
            membersPerMonth: 1999,
            currency: 'USD',
        });
    });
});

describe('getUsersAndAddons()', () => {
    it('should return plan name and number of users', () => {
        expect(
            getUsersAndAddons(
                {
                    [PLANS.VPN]: 1,
                },
                {
                    [PLANS.VPN]: getPlan(vpnPlan),
                }
            )
        ).toEqual({
            planName: PLANS.VPN,
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
});
