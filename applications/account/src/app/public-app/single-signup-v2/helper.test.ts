import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
    multiSubscriptionTestCatalog,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans, getTestPlans, getTestPlansMap } from '@proton/payments/testing/data-plans';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, USER_ROLES } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import type { User } from '@proton/shared/lib/interfaces/User';
import type { Plan, PlansMap } from '@proton/shared/lib/payments/plan/interface';
import { SubscriptionMode, SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';

import {
    getAccessiblePlans,
    getCurrencyForNewAudience,
    getOtherUserSessions,
    getSessionCycle,
    getSubscriptionData,
    getUserInfo,
} from './helper';
import type { SubscriptionDataCycleMapping } from './helper';
import { type PlanCard, type SignupConfiguration, type SignupParameters2, UpsellTypes } from './interface';

vi.mock('@proton/payments/core/api/api', async () => ({
    ...(await vi.importActual<any>('@proton/payments/core/api/api')),
    getPaymentMethods: vi.fn().mockResolvedValue([]),
}));

vi.mock('@proton/payments/sentry/capture', () => ({
    tracePaymentError: vi.fn(),
}));

describe('getOtherUserSessions', () => {
    const session = (LocalID: number, UserID: string) => ({ remote: { LocalID, UserID } }) as ActiveSession;
    const sessions = [session(0, 'a'), session(1, 'b'), session(2, 'a')];

    it('drops every session of the given user', () => {
        expect(getOtherUserSessions(sessions, 'a')).toEqual([session(1, 'b')]);
    });

    it('keeps every session without a user', () => {
        expect(getOtherUserSessions(sessions, undefined)).toEqual(sessions);
    });
});

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
            subscription: undefined,
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
            subscription: undefined,
            options: { cycle: CYCLE.SIX, planIDs: bundlePlanIDs },
            availableCycles,
            plansMap,
        });

        expect(cycle).toBe(CYCLE.SIX);
    });

    it('should fall back to the highest offered cycle when the plan has no pricing for the requested cycle', () => {
        const cycle = getSessionCycle({
            signupParameters: { cycle: CYCLE.SIX },
            subscription: undefined,
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

describe('getUserInfo entitlement catalog for a signed-in user', () => {
    const plansMap = getTestPlansMap('EUR');
    const planIDs = { [PLANS.LUMO]: 1 };
    const user = { ID: 'user-id', Role: USER_ROLES.ADMIN_ROLE, Subscribed: 1 } as User;
    const mailPlus = buildSubscription(PLANS.MAIL);

    const signedInApi = vi.fn(async ({ url }: { url: string }) => {
        if (url === 'payments/v4/subscription') {
            return { Subscription: mailPlus, UpcomingSubscription: undefined };
        }
        if (url.includes('organizations')) {
            return { Organization: { MaxMembers: 1, UsedLumo: 0, MaxLumo: 0 } };
        }
        return { PaymentMethods: [] };
    }) as unknown as Api;

    const checkSubscription = vi.fn(async (data: CheckSubscriptionData): Promise<SubscriptionEstimation> => ({
        Amount: 0,
        AmountDue: 0,
        CouponDiscount: 0,
        Cycle: data.Cycle,
        Coupon: null,
        Currency: data.Currency,
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
        PeriodEnd: 0,
        requestData: data,
    }));

    const callGetUserInfo = (
        getEntitlementCatalog: (options: { api: Api }) => Promise<typeof multiSubscriptionTestCatalog>,
        lumoMultiSubscriptions = true
    ) =>
        getUserInfo({
            lumoMultiSubscriptions,
            getEntitlementCatalog,
            paymentStatus: undefined,
            api: signedInApi,
            audience: Audience.B2C,
            paymentsApi: { checkSubscription } as unknown as PaymentsApi,
            user,
            options: {
                plansMap,
                planIDs,
                cycle: CYCLE.YEARLY,
                currency: 'EUR',
                billingAddress: { CountryCode: 'CH', State: null },
                VatId: undefined,
            },
            plansMap,
            plans: Object.values(plansMap) as Plan[],
            planParameters: { defined: true, planIDs, plan: plansMap[PLANS.LUMO] as Plan },
            signupParameters: {} as SignupParameters2,
            toApp: APPS.PROTONLUMO,
            availableCycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
        });

    beforeEach(() => {
        vi.mocked(tracePaymentError).mockClear();
    });

    it('loads the catalog with the signed-in api and turns the Lumo rules on', async () => {
        const getEntitlementCatalog = vi.fn().mockResolvedValue(multiSubscriptionTestCatalog);

        const { multiSubscriptionContext } = await callGetUserInfo(getEntitlementCatalog);

        expect(getEntitlementCatalog).toHaveBeenCalledWith({ api: signedInApi });
        expect(multiSubscriptionContext.lumoMultiSubscriptions).toBe(true);
        expect(multiSubscriptionContext.entitlementCatalog).toBe(multiSubscriptionTestCatalog);
    });

    it('reports a failed catalog request and falls back to the rules without the flag', async () => {
        const unauthorized = new Error('Invalid access token');
        const getEntitlementCatalog = vi.fn().mockRejectedValue(unauthorized);

        const { multiSubscriptionContext } = await callGetUserInfo(getEntitlementCatalog);

        expect(multiSubscriptionContext.lumoMultiSubscriptions).toBe(false);
        expect(multiSubscriptionContext.entitlementCatalog).toBeUndefined();
        expect(tracePaymentError).toHaveBeenCalledWith(unauthorized, { component: 'single-signup-v2-user-info' });
    });

    it('does not load the catalog with the flag off', async () => {
        const getEntitlementCatalog = vi.fn();

        const { multiSubscriptionContext } = await callGetUserInfo(getEntitlementCatalog, false);

        expect(getEntitlementCatalog).not.toHaveBeenCalled();
        expect(multiSubscriptionContext.lumoMultiSubscriptions).toBe(false);
    });
});

describe('getUserInfo cycle for a signed-in user', () => {
    const testPlansMap = getTestPlansMap('CHF');
    const planIDs = { [PLANS.BUNDLE]: 1 };
    const user = { ID: 'user-id', Role: USER_ROLES.FREE_ROLE, Subscribed: 0 } as User;

    const getMockPaymentsApi = () => {
        const checkSubscription = vi.fn(async (data: CheckSubscriptionData): Promise<SubscriptionEstimation> => ({
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
            lumoMultiSubscriptions: false,
            getEntitlementCatalog: vi.fn(),
            paymentStatus: undefined,
            api: vi.fn() as unknown as Api,
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

describe('getSubscriptionData guards', () => {
    const plansMap = getTestPlansMap('USD');
    const getPaymentsApiMock = () => {
        const checkSubscription = vi.fn(async (data: CheckSubscriptionData) => ({ requestData: data }) as any);
        return { paymentsApi: { checkSubscription } as unknown as PaymentsApi, checkSubscription };
    };
    const options = {
        plansMap,
        planIDs: { [PLANS.VPN2024]: 1 },
        cycle: CYCLE.YEARLY,
        currency: 'USD' as const,
        billingAddress: { CountryCode: 'CH', State: null },
        VatId: undefined,
        multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
    };

    it('asks the initial check to validate guards when a paid subscription is being modified', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionData(paymentsApi, {
            ...options,
            subscription: buildSubscription(PLANS.BUNDLE),
        });

        expect(checkSubscription).toHaveBeenCalledTimes(1);
        expect(checkSubscription.mock.calls[0][0].ValidateGuards).toBe(true);
    });

    it('does not ask to validate guards for a visitor without subscription', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionData(paymentsApi, options);

        expect(checkSubscription.mock.calls[0][0]).not.toHaveProperty('ValidateGuards');
    });
});

describe('getSubscriptionData after a failed check', () => {
    const options = {
        plansMap: getTestPlansMap('USD'),
        planIDs: { [PLANS.BUNDLE]: 1 },
        cycle: CYCLE.YEARLY,
        currency: 'USD' as const,
        billingAddress: { CountryCode: 'CH', State: null },
        VatId: undefined,
        multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
    };
    const getDataAfterCheckError = (error: unknown) => {
        const checkSubscription = vi.fn().mockRejectedValue(error);
        return getSubscriptionData({ checkSubscription } as unknown as PaymentsApi, options);
    };

    it('reports a check the backend refused and drops the plan', async () => {
        const subscriptionData = await getDataAfterCheckError({
            status: 422,
            data: { Code: 2000, Error: 'Unable to combine the new plan with the existing subscriptions.' },
        });

        expect(subscriptionData.checkRefused).toBe(true);
        expect(subscriptionData.planIDs).toEqual({});
    });

    it.each([
        ['a server error', { status: 500, data: { Code: 2000, Error: 'Internal error' } }],
        ['a rate limit', { status: 429, data: { Code: 2028, Error: 'Too many requests' } }],
        ['a missing permission', { status: 403, data: { Code: 2011, Error: 'Not allowed' } }],
        ['an invalid request', { status: 400, data: { Code: 2000, Error: 'Invalid input' } }],
        ['a client error', new TypeError('Cannot read properties of undefined')],
        ['an offline user', Object.assign(new Error('Offline'), { name: 'OfflineError' })],
    ])('does not report a check that failed because of %s', async (_, error) => {
        const subscriptionData = await getDataAfterCheckError(error);

        expect(subscriptionData.checkRefused).toBe(false);
    });

    it('does not report a successful check', async () => {
        const checkSubscription = vi.fn(async (data: CheckSubscriptionData) => ({ requestData: data }) as any);

        const subscriptionData = await getSubscriptionData({ checkSubscription } as unknown as PaymentsApi, options);

        expect(subscriptionData.checkRefused).toBe(false);
        expect(subscriptionData.planIDs).toEqual({ [PLANS.BUNDLE]: 1 });
    });
});

describe('getSubscriptionData for a subscriber with a prepaid upcoming term', () => {
    const plansMap = getTestPlansMap('EUR');
    const monthlyMailPlus = buildSubscription(
        { planName: PLANS.MAIL, cycle: CYCLE.MONTHLY, currency: 'EUR' },
        {
            UpcomingSubscription: buildSubscription(
                { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'EUR' },
                { IsPrepaid: true }
            ),
        }
    );

    const getMailPlusData = (cycle: CYCLE) => {
        const checkSubscription = vi.fn(async (data: CheckSubscriptionData) => ({ requestData: data }) as any);
        const subscriptionData = getSubscriptionData({ checkSubscription } as unknown as PaymentsApi, {
            plansMap,
            planIDs: { [PLANS.MAIL]: 1 },
            cycle,
            currency: 'EUR',
            billingAddress: { CountryCode: 'CH', State: null },
            VatId: undefined,
            subscription: monthlyMailPlus.UpcomingSubscription ?? monthlyMailPlus,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(monthlyMailPlus),
        });
        return { subscriptionData, checkSubscription };
    };

    it.each([
        ['the current term', CYCLE.MONTHLY],
        ['the upcoming term', CYCLE.YEARLY],
    ])('prices %s without calling subscription/check', async (_, cycle) => {
        const { subscriptionData, checkSubscription } = getMailPlusData(cycle);

        const { checkResult } = await subscriptionData;

        expect(checkSubscription).not.toHaveBeenCalled();
        expect(checkResult).toMatchObject({
            optimistic: true,
            Cycle: cycle,
            Amount: plansMap[PLANS.MAIL]?.Pricing[cycle],
        });
    });

    it('checks another cycle of the plan', async () => {
        const { subscriptionData, checkSubscription } = getMailPlusData(CYCLE.TWO_YEARS);

        await subscriptionData;

        expect(checkSubscription).toHaveBeenCalledTimes(1);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({
            Plans: { [PLANS.MAIL]: 1 },
            Cycle: CYCLE.TWO_YEARS,
            Currency: 'EUR',
        });
    });
});

describe('getUserInfo with the Lumo purchase rules', () => {
    const plansMap = getTestPlansMap('EUR');
    const plansInEurAndUsd = [...(Object.values(plansMap) as Plan[]), ...getTestPlans('USD')];
    const lumoPlanIDs = { [PLANS.LUMO]: 1 };
    const user = { ID: 'user-id', Role: USER_ROLES.ADMIN_ROLE, Subscribed: 1 } as User;

    const getApi = (subscription: Subscription) => {
        return vi.fn(async ({ url }: { url: string }) => {
            if (url === 'payments/v4/subscription') {
                return { Subscription: subscription, UpcomingSubscription: undefined };
            }
            if (url.includes('organizations')) {
                return { Organization: { MaxMembers: 1, UsedLumo: 0, MaxLumo: 0 } };
            }
            return { PaymentMethods: [] };
        }) as unknown as Api;
    };

    const runGetUserInfo = async (
        subscription: Subscription,
        lumoMultiSubscriptions: boolean,
        selectedPlanName: PLANS = PLANS.LUMO
    ) => {
        const selectedPlanIDs = { [selectedPlanName]: 1 };
        const checkSubscription = vi.fn(async (data: CheckSubscriptionData): Promise<SubscriptionEstimation> => ({
            Amount: 0,
            AmountDue: 0,
            CouponDiscount: 0,
            Cycle: data.Cycle,
            Coupon: null,
            Currency: data.Currency,
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: 0,
            requestData: data,
        }));

        const { subscriptionData, upsell } = await getUserInfo({
            api: getApi(subscription),
            audience: Audience.B2C,
            paymentsApi: { checkSubscription } as unknown as PaymentsApi,
            user,
            options: {
                plansMap,
                planIDs: selectedPlanIDs,
                cycle: CYCLE.YEARLY,
                currency: 'EUR',
                billingAddress: { CountryCode: 'CH', State: null },
                VatId: undefined,
            },
            plansMap,
            plans: plansInEurAndUsd,
            planParameters: { defined: true, planIDs: selectedPlanIDs, plan: plansMap[selectedPlanName] as Plan },
            signupParameters: {} as SignupParameters2,
            toApp: APPS.PROTONLUMO,
            availableCycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
            lumoMultiSubscriptions,
            getEntitlementCatalog: vi.fn().mockResolvedValue(multiSubscriptionTestCatalog),
            paymentStatus: undefined,
        });

        return { subscriptionData, upsell, checkSubscription };
    };

    const getSelectedPlanIDs = async (subscription: Subscription, lumoMultiSubscriptions: boolean) => {
        const { subscriptionData } = await runGetUserInfo(subscription, lumoMultiSubscriptions);
        return subscriptionData.planIDs;
    };

    it('gives a Mail Plus subscriber Lumo Plus only with the flag on', async () => {
        const subscription = buildSubscription(PLANS.MAIL);

        expect(await getSelectedPlanIDs(subscription, false)).toEqual({
            [PLANS.MAIL]: 1,
            [ADDON_NAMES.LUMO_MAIL]: 1,
        });
        expect(await getSelectedPlanIDs(subscription, true)).toEqual(lumoPlanIDs);
    });

    it('keeps the Lumo addon for a Mail Plus subscriber who already has it, with the flag on', async () => {
        const subscription = buildSubscription({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 });

        expect(await getSelectedPlanIDs(subscription, true)).toEqual({
            [PLANS.MAIL]: 1,
            [ADDON_NAMES.LUMO_MAIL]: 1,
        });
    });

    it('offers Unlimited to a web Mail Plus subscriber who picks Drive Plus, with the flag on', async () => {
        const { upsell } = await runGetUserInfo(buildSubscription(PLANS.MAIL), true, PLANS.DRIVE);

        expect(upsell.plan?.Name).toBe(PLANS.BUNDLE);
    });

    it('offers no upsell when Drive Plus is refused next to a store Mail Plus subscription, with the flag on', async () => {
        const storeMailPlus = buildSubscription(PLANS.MAIL, { External: SubscriptionPlatform.iOS });

        const { upsell } = await runGetUserInfo(storeMailPlus, true, PLANS.DRIVE);

        expect(upsell.plan).toBeUndefined();
    });

    it('gives a Family subscriber the Lumo addon with the flag on', async () => {
        expect(await getSelectedPlanIDs(buildSubscription(PLANS.FAMILY), true)).toEqual({
            [PLANS.FAMILY]: 1,
            [ADDON_NAMES.LUMO_FAMILY]: 1,
        });
    });

    it('buys Lumo in the currency of the web subscription it runs next to, with the flag on', async () => {
        const subscription = buildSubscription(PLANS.MAIL, { Currency: 'USD' });

        const { subscriptionData, checkSubscription } = await runGetUserInfo(subscription, true);

        expect(subscriptionData.currency).toBe('USD');
        expect(checkSubscription).toHaveBeenCalledWith(expect.objectContaining({ Currency: 'USD' }), expect.anything());
    });

    it('keeps the requested currency with the flag off', async () => {
        const subscription = buildSubscription(PLANS.MAIL, { Currency: 'USD' });

        const { subscriptionData } = await runGetUserInfo(subscription, false);

        expect(subscriptionData.currency).toBe('EUR');
    });
});

describe('getUserInfo for a signed-in user with several subscriptions', () => {
    const plansMap = getTestPlansMap('EUR');
    const lumoUltra = { ...plansMap[PLANS.LUMO], ID: 'lumo-ultra', Name: PLANS.LUMO_ULTRA } as Plan;
    const plansMapWithLumoUltra = { ...plansMap, [PLANS.LUMO_ULTRA]: lumoUltra };
    const user = {
        ID: 'user-id',
        Role: USER_ROLES.ADMIN_ROLE,
        Subscribed: 1,
        HasMultipleSubscriptions: 1,
    } as unknown as User;
    const MAIL_PLUS_COUPON = 'MAILPLUSCOUPON';
    const LUMO_PLUS_COUPON = 'LUMOPLUSCOUPON';

    const webMailPlus = buildSubscription(
        { planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'EUR' },
        { ID: 'mail-plus', CouponCode: MAIL_PLUS_COUPON }
    );
    const webLumoPlus = buildLumoSubscription(PLANS.LUMO, {
        ID: 'lumo-plus',
        Cycle: CYCLE.MONTHLY,
        CouponCode: LUMO_PLUS_COUPON,
    });
    const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, { ID: 'ios-lumo-plus', External: SubscriptionPlatform.iOS });

    const toV5Subscription = (subscription: Subscription) => ({ ...subscription, Name: subscription.Plans[0].Name });

    const getApi = (primary: Subscription, secondaries: Subscription[], upcomingSecondaries: Subscription[] = []) =>
        vi.fn(async ({ url }: { url: string }) => {
            if (url === 'payments/v4/subscription') {
                return { Subscription: primary, UpcomingSubscription: undefined };
            }
            if (url.startsWith('payments/v5/subscription')) {
                return {
                    Subscriptions: [primary, ...secondaries].map(toV5Subscription),
                    UpcomingSubscriptions: upcomingSecondaries.map(toV5Subscription),
                };
            }
            if (url.includes('organizations')) {
                return { Organization: { MaxMembers: 1, UsedLumo: 0, MaxLumo: 0 } };
            }
            return { PaymentMethods: [] };
        }) as unknown as Api;

    const runGetUserInfo = async ({
        api,
        selectedPlanName,
        planDefined,
        lumoMultiSubscriptions = true,
    }: {
        api: Api;
        selectedPlanName: PLANS;
        planDefined: boolean;
        lumoMultiSubscriptions?: boolean;
    }) => {
        const selectedPlanIDs = { [selectedPlanName]: 1 };
        const checkSubscription = vi.fn(async (data: CheckSubscriptionData): Promise<SubscriptionEstimation> => ({
            Amount: 0,
            AmountDue: 0,
            CouponDiscount: 0,
            Cycle: data.Cycle,
            Coupon: null,
            Currency: data.Currency,
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            PeriodEnd: 0,
            requestData: data,
        }));

        const result = await getUserInfo({
            api,
            audience: Audience.B2C,
            paymentsApi: { checkSubscription } as unknown as PaymentsApi,
            user,
            options: {
                plansMap: plansMapWithLumoUltra,
                planIDs: selectedPlanIDs,
                cycle: CYCLE.TWO_YEARS,
                currency: 'EUR',
                billingAddress: { CountryCode: 'CH', State: null },
                VatId: undefined,
            },
            plansMap: plansMapWithLumoUltra,
            plans: Object.values(plansMapWithLumoUltra) as Plan[],
            planParameters: {
                defined: planDefined,
                planIDs: selectedPlanIDs,
                plan: plansMapWithLumoUltra[selectedPlanName] as Plan,
            },
            signupParameters: {} as SignupParameters2,
            toApp: APPS.PROTONLUMO,
            availableCycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
            lumoMultiSubscriptions,
            getEntitlementCatalog: vi.fn().mockResolvedValue(multiSubscriptionTestCatalog),
            paymentStatus: undefined,
        });

        return { ...result, checkSubscription };
    };

    it('buys Lumo Plus next to Mail Plus yearly without the Mail Plus cycle, coupon or guards', async () => {
        const { subscriptionData, upsell, checkSubscription } = await runGetUserInfo({
            api: getApi(webMailPlus, []),
            selectedPlanName: PLANS.LUMO,
            planDefined: true,
        });

        expect(subscriptionData.cycle).toBe(CYCLE.TWO_YEARS);
        expect(upsell.currentPlan).toBeUndefined();
        expect(checkSubscription).toHaveBeenCalledTimes(1);
        const checkData = checkSubscription.mock.calls[0][0];
        expect(checkData).toMatchObject({ Plans: { [PLANS.LUMO]: 1 }, Cycle: CYCLE.TWO_YEARS });
        expect(checkData.CouponCode).toBeUndefined();
        expect(checkData).not.toHaveProperty('ValidateGuards');
    });

    it('takes the cycle and coupon of Lumo Plus monthly when the selection changes it, not those of Mail Plus yearly', async () => {
        const { subscriptionData, checkSubscription } = await runGetUserInfo({
            api: getApi(webMailPlus, [webLumoPlus]),
            selectedPlanName: PLANS.LUMO_ULTRA,
            planDefined: false,
        });

        expect(subscriptionData.cycle).toBe(CYCLE.MONTHLY);
        expect(checkSubscription).toHaveBeenCalledTimes(1);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({
            Plans: { [PLANS.LUMO_ULTRA]: 1 },
            Cycle: CYCLE.MONTHLY,
            CouponCode: LUMO_PLUS_COUPON,
            ValidateGuards: true,
        });
    });

    it('takes the cycle and coupon of the upcoming Lumo Plus term when it has one', async () => {
        const UPCOMING_LUMO_PLUS_COUPON = 'LUMOPLUSUPCOMING';
        const upcomingLumoPlus = {
            ...buildLumoSubscription(PLANS.LUMO, {
                ID: 'lumo-plus-upcoming',
                Cycle: CYCLE.TWO_YEARS,
                CouponCode: UPCOMING_LUMO_PLUS_COUPON,
            }),
            ParentSubscriptionID: webLumoPlus.ID,
        };

        const { subscriptionData, checkSubscription } = await runGetUserInfo({
            api: getApi(webMailPlus, [webLumoPlus], [upcomingLumoPlus]),
            selectedPlanName: PLANS.LUMO_ULTRA,
            planDefined: false,
        });

        expect(subscriptionData.cycle).toBe(CYCLE.TWO_YEARS);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({
            Cycle: CYCLE.TWO_YEARS,
            CouponCode: UPCOMING_LUMO_PLUS_COUPON,
        });
    });

    it('checks out Lumo Ultra in place of Lumo Plus without the Unlimited upsell', async () => {
        const { subscriptionData, upsell, checkSubscription } = await runGetUserInfo({
            api: getApi(webMailPlus, [webLumoPlus]),
            selectedPlanName: PLANS.LUMO_ULTRA,
            planDefined: true,
        });

        expect(upsell.mode).toBe(UpsellTypes.PLANS);
        expect(upsell.plan).toBeUndefined();
        expect(subscriptionData.cycle).toBe(CYCLE.MONTHLY);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({
            Plans: { [PLANS.LUMO_ULTRA]: 1 },
            Cycle: CYCLE.MONTHLY,
            CouponCode: LUMO_PLUS_COUPON,
        });
    });

    it('offers no Unlimited upsell to a single Lumo Plus subscriber who picks Lumo Plus again', async () => {
        const { upsell } = await runGetUserInfo({
            api: getApi(webLumoPlus, []),
            selectedPlanName: PLANS.LUMO,
            planDefined: true,
        });

        expect(upsell.mode).toBe(UpsellTypes.PLANS);
        expect(upsell.plan).toBeUndefined();
    });

    it('shows Lumo Plus as the current plan when the selected Lumo Plus changes it', async () => {
        const { subscriptionData, upsell } = await runGetUserInfo({
            api: getApi(webMailPlus, [webLumoPlus]),
            selectedPlanName: PLANS.LUMO,
            planDefined: true,
        });

        expect(upsell.currentPlan?.Name).toBe(PLANS.LUMO);
        expect(subscriptionData.cycle).toBe(CYCLE.MONTHLY);
    });

    it('lets a Lumo Plus subscriber change the Lumo Plus cycle without the Unlimited upsell', async () => {
        const { upsell } = await runGetUserInfo({
            api: getApi(webMailPlus, [webLumoPlus]),
            selectedPlanName: PLANS.LUMO,
            planDefined: true,
        });

        expect(upsell.mode).toBe(UpsellTypes.PLANS);
        expect(upsell.plan).toBeUndefined();
    });

    it('keeps the Unlimited upsell for a single Mail Plus subscriber who picks Mail Plus again', async () => {
        const { upsell } = await runGetUserInfo({
            api: getApi(webMailPlus, []),
            selectedPlanName: PLANS.MAIL,
            planDefined: true,
        });

        expect(upsell.mode).toBe(UpsellTypes.UPSELL);
        expect(upsell.plan?.Name).toBe(PLANS.BUNDLE);
        expect(upsell.currentPlan?.Name).toBe(PLANS.MAIL);
    });

    it('treats a refused Drive Plus purchase next to Mail Plus and Lumo Plus like a purchase without subscription', async () => {
        const { state, subscriptionData, upsell } = await runGetUserInfo({
            api: getApi(webMailPlus, [webLumoPlus]),
            selectedPlanName: PLANS.DRIVE,
            planDefined: true,
        });

        expect(state.unavailable).toBe(true);
        expect(subscriptionData.cycle).toBe(CYCLE.TWO_YEARS);
        expect(upsell.currentPlan).toBeUndefined();
    });

    it('shows Drive Plus as unavailable next to two web subscriptions with the flag off', async () => {
        const { state, upsell } = await runGetUserInfo({
            api: getApi(webMailPlus, [webLumoPlus]),
            selectedPlanName: PLANS.DRIVE,
            planDefined: true,
            lumoMultiSubscriptions: false,
        });

        expect(state.unavailable).toBe(true);
        expect(state.access).toBe(false);
        expect(upsell.currentPlan).toBeUndefined();
    });

    it('lets a store Lumo Plus subscriber without a web subscription buy Mail Plus with the flag off', async () => {
        const { state, checkSubscription } = await runGetUserInfo({
            api: getApi(iosLumoPlus, []),
            selectedPlanName: PLANS.MAIL,
            planDefined: true,
            lumoMultiSubscriptions: false,
        });

        expect(state.unavailable).toBe(false);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({ Plans: { [PLANS.MAIL]: 1 } });
    });

    it('lets a single web Mail Plus subscriber next to a store Lumo Plus subscription buy Drive Plus with the flag off', async () => {
        const { state, checkSubscription } = await runGetUserInfo({
            api: getApi(webMailPlus, [iosLumoPlus]),
            selectedPlanName: PLANS.DRIVE,
            planDefined: true,
            lumoMultiSubscriptions: false,
        });

        expect(state.unavailable).toBe(false);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({
            Plans: { [PLANS.BUNDLE]: 1 },
            Cycle: CYCLE.YEARLY,
            CouponCode: MAIL_PLUS_COUPON,
            ValidateGuards: true,
        });
    });

    it('keeps the cycle, coupon, guards and current plan of a single Mail Plus subscription it changes', async () => {
        const { subscriptionData, upsell, checkSubscription } = await runGetUserInfo({
            api: getApi(webMailPlus, []),
            selectedPlanName: PLANS.DUO,
            planDefined: true,
        });

        expect(upsell.currentPlan?.Name).toBe(PLANS.MAIL);
        expect(subscriptionData.cycle).toBe(CYCLE.YEARLY);
        expect(checkSubscription.mock.calls[0][0]).toMatchObject({
            Plans: { [PLANS.DUO]: 1 },
            Cycle: CYCLE.YEARLY,
            CouponCode: MAIL_PLUS_COUPON,
            ValidateGuards: true,
        });
    });
});

describe('getCurrencyForNewAudience', () => {
    const plans = [
        ...getTestPlans('EUR'),
        ...getTestPlans('USD'),
        ...getTestPlans('CHF'),
        ...getTestPlans('BRL').filter((plan) => plan.Name === PLANS.MAIL || plan.Name === PLANS.BUNDLE),
    ];
    const toPlanCards = (planNames: PLANS[]) =>
        planNames.map((plan) => ({ plan, subsection: null, type: 'standard', guarantee: true })) as PlanCard[];
    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2C]: toPlanCards([PLANS.MAIL, PLANS.BUNDLE]),
        [Audience.B2B]: toPlanCards([PLANS.MAIL_PRO, PLANS.BUNDLE_PRO_2024]),
    };
    const brlCycleMapping = {
        [PLANS.MAIL]: {},
        [PLANS.BUNDLE]: {},
    } as SubscriptionDataCycleMapping;
    const business = { value: Audience.B2B, defaultPlan: PLANS.BUNDLE_PRO_2024 };
    const individuals = { value: Audience.B2C, defaultPlan: PLANS.BUNDLE };

    const getCurrency = (
        newAudience: typeof business,
        session?: { resumedSessionResult: { User: User }; multiSubscriptionContext: MultiSubscriptionContext }
    ) =>
        getCurrencyForNewAudience({
            currency: 'BRL',
            newAudience,
            planCards,
            model: {
                plans,
                paymentStatus: { CountryCode: 'BR', VendorStates: {} as any },
                session,
                subscriptionDataCycleMapping: brlCycleMapping,
            },
        });

    it('switches a visitor from Brazil to USD when the business plans have no BRL price', () => {
        expect(getCurrency(business)).toBe('USD');
    });

    it('keeps BRL when the individual plans have a BRL price', () => {
        expect(getCurrency(individuals)).toBeUndefined();
    });

    it('switches a user with two BRL subscriptions to USD, because the business plan has no BRL price to lock to', () => {
        const mailPlus = buildSubscription(PLANS.MAIL, { Currency: 'BRL' });
        const lumoPlus = buildSubscription(PLANS.LUMO, { Currency: 'BRL' });
        const session = {
            resumedSessionResult: { User: buildUser({ Currency: 'BRL' }) },
            multiSubscriptionContext: buildMultiSubscriptionContext([mailPlus, lumoPlus]),
        };

        expect(getCurrency(business, session)).toBe('USD');
    });

    it('switches a user with two BRL subscriptions to USD when the business default plan is not one of the cards', () => {
        const mailPlus = buildSubscription(PLANS.MAIL, { Currency: 'BRL' });
        const lumoPlus = buildSubscription(PLANS.LUMO, { Currency: 'BRL' });

        expect(
            getCurrencyForNewAudience({
                currency: 'BRL',
                newAudience: business,
                planCards: { ...planCards, [Audience.B2B]: toPlanCards([PLANS.LUMO_BUSINESS]) },
                model: {
                    plans,
                    paymentStatus: { CountryCode: 'BR', VendorStates: {} as any },
                    session: {
                        resumedSessionResult: { User: buildUser({ Currency: 'BRL' }) },
                        multiSubscriptionContext: buildMultiSubscriptionContext([mailPlus, lumoPlus]),
                    },
                    subscriptionDataCycleMapping: brlCycleMapping,
                },
            })
        ).toBe('USD');
    });
});
