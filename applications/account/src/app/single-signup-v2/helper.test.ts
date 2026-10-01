import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import type { Plan, PlansMap } from '@proton/payments/core/plan/interface';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { getLongTestPlans, getTestPlansMap } from '@proton/payments/testing/data-plans';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';

import { getAccessiblePlans, getSessionCycle, getUserInfo } from './helper';
import type { PlanCard, SignupParameters2 } from './interface';

jest.mock('@proton/payments/core/api/api', () => ({
    ...jest.requireActual('@proton/payments/core/api/api'),
    getPaymentMethods: jest.fn().mockResolvedValue([]),
}));

describe('getAccessiblePlans', () => {
    const mockPlanCards = {
        [Audience.B2C]: [
            {
                plan: PLANS.MAIL,
                subsection: null,
                type: 'standard',
                guarantee: true,
            },
            {
                plan: PLANS.VPN2024,
                subsection: null,
                type: 'best',
                guarantee: true,
            },
        ] as PlanCard[],
        [Audience.B2B]: [
            {
                plan: PLANS.MAIL_PRO,
                subsection: null,
                type: 'standard',
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                subsection: null,
                type: 'best',
                guarantee: true,
            },
        ] as PlanCard[],
    };

    const allPlans = getLongTestPlans();

    it('should return accessible B2C plans', () => {
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
        });

        expect(result.length).toBe(8); // 2 for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
            ])
        );
    });

    it('should return accessible B2B plans', () => {
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2B,
            plans: allPlans,
        });

        expect(result.length).toBe(8); // 2 for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL_PRO} - USD`,
                `${PLANS.BUNDLE_PRO_2024} - USD`,
                `${PLANS.MAIL_PRO} - CHF`,
                `${PLANS.BUNDLE_PRO_2024} - CHF`,
                `${PLANS.MAIL_PRO} - EUR`,
                `${PLANS.BUNDLE_PRO_2024} - EUR`,
                `${PLANS.MAIL_PRO} - BRL`,
                `${PLANS.BUNDLE_PRO_2024} - BRL`,
            ])
        );
    });

    it('should return empty array for invalid audience', () => {
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            // @ts-expect-error
            audience: 'INVALID_AUDIENCE',
            plans: allPlans,
        });

        expect(result).toEqual([]);
    });

    it('should return only plans that exist in allPlans', () => {
        const limitedPlans = allPlans.filter((plan) => plan.Name === PLANS.MAIL);
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: limitedPlans,
        });

        expect(result.length).toBe(4); // 1 for each of 4 regional currencies
        expect(result[0].Name).toBe(PLANS.MAIL);
    });

    it('should handle empty planCards', () => {
        const emptyPlanCards = {
            [Audience.B2C]: [] as PlanCard[],
            [Audience.B2B]: [] as PlanCard[],
        };

        const result = getAccessiblePlans({
            planCards: emptyPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
        });
        expect(result).toEqual([]);
    });

    it('should include param plan when it exists in plans', () => {
        const paramPlanName = PLANS.VISIONARY;
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
            paramPlanName,
        });

        // Should include original plans plus the param plan
        expect(result.length).toBe(12); // 3 plans (2 original + 1 param) for each of 4 regional currencies

        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.VISIONARY} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.VISIONARY} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.VISIONARY} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
                `${PLANS.VISIONARY} - BRL`,
            ])
        );
    });

    it('should not duplicate plans if param plan is already in accessible plans', () => {
        const paramPlanName = PLANS.MAIL;
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
            paramPlanName,
        });

        expect(result.length).toBe(8); // Still 2 plans for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
            ])
        );
    });

    it('should ignore param plan when it does not exist in plans', () => {
        const paramPlanName = 'NON_EXISTENT_PLAN';
        const result = getAccessiblePlans({
            planCards: mockPlanCards,
            audience: Audience.B2C,
            plans: allPlans,
            paramPlanName,
        });

        expect(result.length).toBe(8); // Still 2 plans for each of 4 regional currencies
        const resultStrings = new Set(result.map(({ Name, Currency }) => `${Name} - ${Currency}`));
        expect(resultStrings).toEqual(
            new Set([
                `${PLANS.MAIL} - USD`,
                `${PLANS.VPN2024} - USD`,
                `${PLANS.MAIL} - CHF`,
                `${PLANS.VPN2024} - CHF`,
                `${PLANS.MAIL} - EUR`,
                `${PLANS.VPN2024} - EUR`,
                `${PLANS.MAIL} - BRL`,
                `${PLANS.VPN2024} - BRL`,
            ])
        );
    });
});

const CAPE_COUPON = 'CAPE';

const withoutSixMonthPricing = (plan: Plan): Plan => {
    const omitSixMonths = (pricing: Plan['Pricing'] | undefined) =>
        Object.fromEntries(Object.entries(pricing ?? {}).filter(([cycle]) => Number(cycle) !== CYCLE.SIX));
    return {
        ...plan,
        Pricing: omitSixMonths(plan.Pricing),
        DefaultPricing: omitSixMonths(plan.DefaultPricing),
    } as Plan;
};

describe('getSessionCycle', () => {
    const plansMap = getTestPlansMap('CHF');
    const availableCycles = [CYCLE.MONTHLY, CYCLE.YEARLY];
    const bundlePlanIDs = { [PLANS.BUNDLE]: 1 };

    it('should keep a requested cycle offered by the signup configuration', () => {
        const cycle = getSessionCycle({
            signupParameters: { cycle: CYCLE.MONTHLY },
            subscription: FREE_SUBSCRIPTION,
            options: { cycle: CYCLE.MONTHLY, planIDs: bundlePlanIDs },
            availableCycles,
            plansMap,
        });

        expect(cycle).toBe(CYCLE.MONTHLY);
    });

    it('should keep a requested 6 month cycle when the plan has 6 month pricing', () => {
        expect(plansMap[PLANS.BUNDLE]?.Pricing[CYCLE.SIX]).toBeDefined();

        const cycle = getSessionCycle({
            signupParameters: { cycle: CYCLE.SIX },
            subscription: FREE_SUBSCRIPTION,
            options: { cycle: CYCLE.SIX, planIDs: bundlePlanIDs },
            availableCycles,
            plansMap,
        });

        expect(cycle).toBe(CYCLE.SIX);
    });

    it('should fall back to the highest offered cycle when the plan has no pricing for the requested cycle', () => {
        const cycle = getSessionCycle({
            signupParameters: { cycle: CYCLE.SIX },
            subscription: FREE_SUBSCRIPTION,
            options: { cycle: CYCLE.SIX, planIDs: bundlePlanIDs },
            availableCycles,
            plansMap: { ...plansMap, [PLANS.BUNDLE]: withoutSixMonthPricing(plansMap[PLANS.BUNDLE] as Plan) },
        });

        expect(cycle).toBe(CYCLE.YEARLY);
    });

    it('should not reuse the cycle of an existing subscription that the signup configuration does not offer', () => {
        const subscription = { Cycle: CYCLE.SIX, CouponCode: CAPE_COUPON } as Subscription;

        const cycle = getSessionCycle({
            signupParameters: { cycle: undefined },
            subscription,
            options: { cycle: CYCLE.YEARLY, planIDs: bundlePlanIDs },
            availableCycles,
            plansMap,
        });

        expect(cycle).toBe(CYCLE.YEARLY);
    });
});

describe('getUserInfo cycle for a signed-in user', () => {
    const testPlansMap = getTestPlansMap('CHF');
    const planIDs = { [PLANS.BUNDLE]: 1 };
    const user = { ID: 'user-id', Role: USER_ROLES.FREE_ROLE, Subscribed: 0 } as User;

    const getMockPaymentsApi = () => {
        const checkSubscription = jest.fn(async (data: CheckSubscriptionData): Promise<SubscriptionEstimation> => ({
            Amount: 5994,
            AmountDue: 5000,
            CouponDiscount: -994,
            Cycle: data.Cycle,
            Coupon: { Code: data.CouponCode as string, Description: '', MaximumRedemptionsPerUser: null },
            Currency: data.Currency,
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: 0,
            requestData: data,
        }));
        return { paymentsApi: { checkSubscription } as unknown as PaymentsApi, checkSubscription };
    };

    const callGetUserInfo = (paymentsApi: PaymentsApi, plansMap: PlansMap) =>
        getUserInfo({
            api: jest.fn() as unknown as Api,
            audience: Audience.B2C,
            paymentsApi,
            user,
            options: {
                plansMap,
                planIDs,
                cycle: CYCLE.SIX,
                currency: 'CHF',
                coupon: CAPE_COUPON,
                billingAddress: { CountryCode: 'CH', State: null },
                VatId: undefined,
            },
            plansMap,
            plans: Object.values(plansMap) as Plan[],
            planParameters: { defined: true, planIDs, plan: plansMap[PLANS.BUNDLE] as Plan },
            signupParameters: { cycle: CYCLE.SIX } as SignupParameters2,
            toApp: undefined,
            availableCycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
        });

    it('should check the subscription with the 6 month cycle when the plan has 6 month pricing', async () => {
        const { paymentsApi, checkSubscription } = getMockPaymentsApi();

        const { subscriptionData } = await callGetUserInfo(paymentsApi, testPlansMap);

        expect(subscriptionData.cycle).toBe(CYCLE.SIX);
        expect(subscriptionData.planIDs).toEqual(planIDs);
        expect(subscriptionData.checkResult.Coupon?.Code).toBe(CAPE_COUPON);
        expect(checkSubscription).toHaveBeenCalledTimes(1);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({
            Plans: planIDs,
            Cycle: CYCLE.SIX,
            CouponCode: CAPE_COUPON,
        });
    });

    it('should check the subscription with the 12 month cycle when the plan has no 6 month pricing', async () => {
        const { paymentsApi, checkSubscription } = getMockPaymentsApi();
        const plansMap = {
            ...testPlansMap,
            [PLANS.BUNDLE]: withoutSixMonthPricing(testPlansMap[PLANS.BUNDLE] as Plan),
        };

        const { subscriptionData } = await callGetUserInfo(paymentsApi, plansMap);

        expect(subscriptionData.cycle).toBe(CYCLE.YEARLY);
        expect(subscriptionData.planIDs).toEqual(planIDs);
        expect(checkSubscription).toHaveBeenCalledTimes(1);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({ Cycle: CYCLE.YEARLY, CouponCode: CAPE_COUPON });
    });
});
