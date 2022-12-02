import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';

import { Plan } from '../../lib/interfaces';

const getPlan = (data: Partial<Plan>) => {
    return { ...data, Type: PLAN_TYPES.PLAN } as Plan;
};
const getAddon = (data: Partial<Plan>) => {
    return { ...data, Type: PLAN_TYPES.ADDON } as Plan;
};

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
};

const visionaryPlan: Partial<Plan> = {
    Name: PLANS.NEW_VISIONARY,
    Title: 'VIS',
    MaxMembers: 6,
    Pricing: {
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
};

const bundleProMember: Partial<Plan> = {
    Name: ADDON_NAMES.MEMBER_BUNDLE_PRO,
    MaxMembers: 1,
    Pricing: {
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
};

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
                },
                plansMap: {
                    [PLANS.VPN]: getPlan(vpnPlan),
                },
            })
        ).toEqual({
            planTitle: 'VPN',
            planName: PLANS.VPN,
            usersTitle: '1 user',
            users: 1,
            addons: [],
            withDiscountPerCycle: 999,
            withDiscountPerMonth: 999,
            discountPerCycle: 0,
            discountPercent: 0,
        });
    });

    it('should calculate bf 24 month visionary', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.NEW_VISIONARY]: 1,
                },
                checkResult: {
                    Amount: 47976,
                    AmountDue: 47976,
                    CouponDiscount: -4776,
                    Cycle: CYCLE.TWO_YEARS,
                    Coupon: {
                        Code: 'TEST',
                        Description: '',
                    },
                },
                plansMap: {
                    [PLANS.NEW_VISIONARY]: getPlan(visionaryPlan),
                },
            })
        ).toEqual({
            planTitle: 'VIS',
            planName: PLANS.NEW_VISIONARY,
            usersTitle: '6 users',
            users: 6,
            addons: [],
            withDiscountPerCycle: 43200,
            withDiscountPerMonth: 1800,
            discountPerCycle: 28776,
            discountPercent: 40,
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
                    },
                },
                plansMap: {
                    [PLANS.VPN]: getPlan(vpnPlan),
                },
            })
        ).toEqual({
            planTitle: 'VPN',
            planName: PLANS.VPN,
            usersTitle: '1 user',
            users: 1,
            addons: [],
            withDiscountPerCycle: 11976,
            withDiscountPerMonth: 399.2,
            discountPerCycle: 17994,
            discountPercent: 50,
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
                },
                plansMap: {
                    [PLANS.BUNDLE_PRO]: getPlan(bundleProPlan),
                    [ADDON_NAMES.MEMBER_BUNDLE_PRO]: getAddon(bundleProMember),
                    [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: getAddon(bundleProDomain),
                },
            })
        ).toEqual({
            planTitle: 'BUS',
            planName: PLANS.BUNDLE_PRO,
            usersTitle: '3 users',
            users: 3,
            addons: [{ name: ADDON_NAMES.DOMAIN_BUNDLE_PRO, quantity: 3, title: '+ 3 custom domains' }],
            withDiscountPerCycle: 81288,
            withDiscountPerMonth: 3387,
            discountPerCycle: 23040,
            discountPercent: 22,
        });
    });

    it('should calculate 100% discount', () => {
        expect(
            getCheckout({
                planIDs: {
                    [PLANS.NEW_VISIONARY]: 1,
                },
                checkResult: {
                    Amount: 47976,
                    AmountDue: 0,
                    CouponDiscount: -47976,
                    Cycle: CYCLE.TWO_YEARS,
                    Coupon: {
                        Code: 'TEST',
                        Description: '',
                    },
                },
                plansMap: {
                    [PLANS.NEW_VISIONARY]: getPlan(visionaryPlan),
                },
            })
        ).toEqual({
            planTitle: 'VIS',
            planName: PLANS.NEW_VISIONARY,
            usersTitle: '6 users',
            users: 6,
            addons: [],
            withDiscountPerCycle: 0,
            withDiscountPerMonth: 0,
            discountPerCycle: 71976,
            discountPercent: 100,
        });
    });
});
