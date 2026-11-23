import { DEFAULT_PAYMENT_VENDOR_STATES, PLANS } from '@proton/payments/core/constants';
import type { Currency, PaymentStatus } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import { paymentStatusReducer } from '../paymentStatus';
import { type SubscriptionState, subscriptionReducer } from '../subscription';
import { getModelState } from '../testing/getModelState';
import { userReducer } from '../user';
import { getPlansThunk, plansReducer, plansThunk, selectPlans } from './index';

describe('plans', () => {
    let mockPlans: Record<Currency, Plan[]>;

    let mockDefaultCurrency: Currency = 'USD';

    beforeEach(() => {
        vi.clearAllMocks();
        mockPlans = {
            USD: [],
            EUR: [],
            CHF: [],
            BRL: [],
            AUD: [],
            CAD: [],
            GBP: [],
            JPY: [],
            KRW: [],
            PLN: [],
            SGD: [],
            HKD: [],
        };
        mockDefaultCurrency = 'USD';
    });

    const apiMock = vi.fn().mockImplementation(({ url, params }) => {
        // handling free plan route
        if (url.includes('plans/default')) {
            // we reject this call, because the helper for free plan includes the hardcoded fallback that we will use
            // as free plan state in these tests
            return Promise.reject();
        }

        if (url === 'payments/v4/subscription') {
            return Promise.resolve({
                Subscription: { Plans: [{ Name: PLANS.MAIL }], Currency: 'USD', Cycle: 12, PeriodEnd: 1 },
            });
        }

        if (url.includes('plans')) {
            const currency = params?.Currency ?? mockDefaultCurrency;
            return Promise.resolve({ Plans: mockPlans[currency as Currency] });
        }
    });

    const defaultPaymentStatus: PaymentStatus = {
        CountryCode: 'CH',
        State: null,
        VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
    };

    const defaultUser = {
        Currency: 'USD',
    } as UserModel;

    const defaultSubscription = {
        Currency: 'USD',
    } as Subscription;

    const setup = (
        paymentStatus: PaymentStatus = defaultPaymentStatus,
        user: UserModel | null = defaultUser,
        subscription: Subscription | null = defaultSubscription
    ) => {
        const extraThunkArguments = {
            api: apiMock,
        } as unknown as ProtonThunkArguments;

        const subscriptionState: SubscriptionState['subscription'] = {
            ...getModelState(subscription ?? undefined),
            meta: {
                ...getModelState(subscription ?? undefined).meta,
                type: 1,
            },
        };

        return getTestStore({
            reducer: { ...userReducer, ...paymentStatusReducer, ...subscriptionReducer, ...plansReducer },
            preloadedState: {
                user: getModelState(user ?? undefined),
                paymentStatus: getModelState(paymentStatus),
                subscription: subscriptionState,
            },
            extraThunkArguments,
        });
    };

    it('should get plans from API', async () => {
        mockPlans.USD = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            },
        ] as Plan[];

        const { store } = setup();
        await store.dispatch(plansThunk());
        expect(apiMock).toHaveBeenCalled();

        expect(selectPlans(store.getState())).toMatchObject({
            value: {
                plans: [
                    {
                        Name: PLANS.MAIL,
                        Currency: 'USD',
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'EUR',
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'CHF',
                    },
                ],
                freePlan: FREE_PLAN,
            },
        });
    });

    it('should store plans with different currencies', async () => {
        mockPlans.USD = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
            },
            {
                Name: PLANS.BUNDLE,
                Currency: 'USD',
            },
        ] as Plan[];

        mockPlans.EUR = [
            {
                Name: PLANS.MAIL,
                Currency: 'EUR',
            },
            {
                Name: PLANS.BUNDLE,
                Currency: 'EUR',
            },
        ] as Plan[];

        const { store } = setup();
        await store.dispatch(plansThunk());

        expect(selectPlans(store.getState())).toMatchObject({
            value: {
                plans: [
                    {
                        Name: PLANS.MAIL,
                        Currency: 'USD',
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'USD',
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'EUR',
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'EUR',
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'CHF',
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'CHF',
                    },
                ],
                freePlan: FREE_PLAN,
            },
        });

        await store.dispatch(plansThunk());

        expect(selectPlans(store.getState())).toMatchObject({
            value: {
                plans: [
                    {
                        Name: PLANS.MAIL,
                        Currency: 'USD',
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'USD',
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'EUR',
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'EUR',
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'CHF',
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'CHF',
                    },
                ],
                freePlan: FREE_PLAN,
            },
        });
    });

    it(`should fetch BRL plans if backend didn't return them - only if user exists`, async () => {
        const { store } = setup({ ...defaultPaymentStatus, CountryCode: 'BR' });

        mockPlans.USD = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Pricing: {
                    1: 100,
                    12: 1000,
                    24: 1800,
                },
            },
            {
                Name: PLANS.BUNDLE,
                Currency: 'USD',
                Pricing: {
                    1: 200,
                    12: 2000,
                    24: 3600,
                },
            },
        ] as Plan[];

        mockPlans.BRL = [
            {
                Name: PLANS.MAIL,
                Currency: 'BRL',
                Pricing: {
                    1: 80,
                    12: 800,
                    24: 1440,
                },
            },
            {
                Name: PLANS.BUNDLE,
                Currency: 'BRL',
                Pricing: {
                    1: 160,
                    12: 1600,
                    24: 2880,
                },
            },
        ] as Plan[];

        await store.dispatch(plansThunk());

        expect(selectPlans(store.getState())).toMatchObject({
            value: {
                plans: [
                    {
                        Name: PLANS.MAIL,
                        Currency: 'USD',
                        Pricing: {
                            1: 100,
                            12: 1000,
                            24: 1800,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'USD',
                        Pricing: {
                            1: 200,
                            12: 2000,
                            24: 3600,
                        },
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'BRL',
                        Pricing: {
                            1: 80,
                            12: 800,
                            24: 1440,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'BRL',
                        Pricing: {
                            1: 160,
                            12: 1600,
                            24: 2880,
                        },
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'EUR',
                        Pricing: {
                            1: 100,
                            12: 1000,
                            24: 1800,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'EUR',
                        Pricing: {
                            1: 200,
                            12: 2000,
                            24: 3600,
                        },
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'CHF',
                        Pricing: {
                            1: 100,
                            12: 1000,
                            24: 1800,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'CHF',
                        Pricing: {
                            1: 200,
                            12: 2000,
                            24: 3600,
                        },
                    },
                ],
                freePlan: FREE_PLAN,
            },
        });
    });

    it(`should fetch BRL plans if backend didn't return them, if user doesn't exist`, async () => {
        const { store } = setup({ ...defaultPaymentStatus, CountryCode: 'BR' }, null, null);

        mockPlans.USD = [
            {
                Name: PLANS.MAIL,
                Currency: 'USD',
                Pricing: {
                    1: 100,
                    12: 1000,
                    24: 1800,
                },
            },
            {
                Name: PLANS.BUNDLE,
                Currency: 'USD',
                Pricing: {
                    1: 200,
                    12: 2000,
                    24: 3600,
                },
            },
        ] as Plan[];

        mockPlans.BRL = [
            {
                Name: PLANS.MAIL,
                Currency: 'BRL',
                Pricing: {
                    1: 80,
                    12: 800,
                    24: 1440,
                },
            },
            {
                Name: PLANS.BUNDLE,
                Currency: 'BRL',
                Pricing: {
                    1: 160,
                    12: 1600,
                    24: 2880,
                },
            },
        ] as Plan[];

        await store.dispatch(plansThunk());

        expect(selectPlans(store.getState())).toMatchObject({
            value: {
                plans: [
                    {
                        Name: PLANS.MAIL,
                        Currency: 'USD',
                        Pricing: {
                            1: 100,
                            12: 1000,
                            24: 1800,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'USD',
                        Pricing: {
                            1: 200,
                            12: 2000,
                            24: 3600,
                        },
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'BRL',
                        Pricing: {
                            1: 80,
                            12: 800,
                            24: 1440,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'BRL',
                        Pricing: {
                            1: 160,
                            12: 1600,
                            24: 2880,
                        },
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'EUR',
                        Pricing: {
                            1: 100,
                            12: 1000,
                            24: 1800,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'EUR',
                        Pricing: {
                            1: 200,
                            12: 2000,
                            24: 3600,
                        },
                    },
                    {
                        Name: PLANS.MAIL,
                        Currency: 'CHF',
                        Pricing: {
                            1: 100,
                            12: 1000,
                            24: 1800,
                        },
                    },
                    {
                        Name: PLANS.BUNDLE,
                        Currency: 'CHF',
                        Pricing: {
                            1: 200,
                            12: 2000,
                            24: 3600,
                        },
                    },
                ],
                freePlan: FREE_PLAN,
            },
        });
    });

    it('stores the error and rejects when the plans request fails', async () => {
        const { store } = setup();
        apiMock.mockImplementationOnce(() => Promise.reject(new Error('failed')));

        await expect(store.dispatch(plansThunk())).rejects.toThrow('failed');

        expect(selectPlans(store.getState()).error).toMatchObject({ message: 'failed' });
        expect(selectPlans(store.getState()).value).toBeUndefined();
    });

    describe('with an offer', () => {
        const getPlansRequests = () =>
            apiMock.mock.calls
                .map(([request]) => request)
                .filter((request) => request.url === 'payments/v4/plans')
                .map((request) => request.params);

        const regularPlan = { Name: PLANS.MAIL, Currency: 'USD', Pricing: { 1: 499 }, Offers: {} } as Plan;
        const offerPlan = {
            Name: PLANS.MAIL,
            Pricing: { 1: 123 },
            DefaultPricing: { 1: 499 },
            Offers: { 1: { Name: 'demo', Description: 'Demo offer' } },
        } as Plan;

        beforeEach(() => {
            mockPlans.USD = [{ ...offerPlan, Currency: 'USD' }];
            mockPlans.EUR = [{ ...offerPlan, Currency: 'EUR', Pricing: { 1: 456 } } as Plan];
            mockPlans.CHF = [{ ...regularPlan, Currency: 'CHF' }];
        });

        it('returns the plans loaded with the offer', async () => {
            const { store } = setup();

            const result = await store.dispatch(getPlansThunk({ offer: 'demo' }));

            expect(result.freePlan).toEqual(FREE_PLAN);
            expect(result.plans).toEqual([
                { ...offerPlan, Currency: 'USD' },
                { ...offerPlan, Currency: 'EUR', Pricing: { 1: 456 } },
                { ...regularPlan, Currency: 'CHF' },
            ]);
        });

        it('sends the offer on every plans request and requests each main currency', async () => {
            const { store } = setup();

            await store.dispatch(getPlansThunk({ offer: 'demo' }));

            expect(getPlansRequests()).toEqual([
                { Offer: 'demo' },
                { Currency: 'EUR', Offer: 'demo' },
                { Currency: 'CHF', Offer: 'demo' },
            ]);
        });

        it('requests each main currency once when the first plans are in a regional currency', async () => {
            mockDefaultCurrency = 'BRL';
            mockPlans.BRL = [{ ...offerPlan, Currency: 'BRL' }];
            const { store } = setup({ ...defaultPaymentStatus, CountryCode: 'BR' });

            await store.dispatch(getPlansThunk({ offer: 'demo' }));

            expect(getPlansRequests()).toEqual([
                { Offer: 'demo' },
                { Currency: 'USD', Offer: 'demo' },
                { Currency: 'EUR', Offer: 'demo' },
                { Currency: 'CHF', Offer: 'demo' },
            ]);
        });

        it('never copies the plans of one main currency to another', async () => {
            mockPlans.CHF = [];
            const { store } = setup();

            const result = await store.dispatch(getPlansThunk({ offer: 'demo' }));

            expect(result.plans.map((plan) => plan.Currency)).toEqual(['USD', 'EUR']);
        });

        it('keeps the plans with the offer apart from the regular plans', async () => {
            mockPlans.USD = [regularPlan];
            const { store } = setup();
            await store.dispatch(plansThunk());
            const regular = selectPlans(store.getState()).value;

            mockPlans.USD = [{ ...offerPlan, Currency: 'USD' }];
            const withOffer = await store.dispatch(getPlansThunk({ offer: 'demo' }));

            expect(selectPlans(store.getState()).value).toBe(regular);
            expect(regular?.plans[0]).toEqual(regularPlan);
            expect(Object.values(store.getState().plansWithOffer).map((entry) => entry?.value)).toEqual([withOffer]);
        });

        it('serves the plans of an offer already loaded without requesting them again', async () => {
            const { store } = setup();

            const first = await store.dispatch(getPlansThunk({ offer: 'demo' }));
            const second = await store.dispatch(getPlansThunk({ offer: 'DEMO' }));

            expect(getPlansRequests()).toHaveLength(3);
            expect(second).toBe(first);
        });

        it('loads the subscription before looking for the stored plans', async () => {
            const paidAdmin = { Currency: 'USD', Role: USER_ROLES.ADMIN_ROLE, Subscribed: 1 } as UserModel;
            const { store } = setup(defaultPaymentStatus, paidAdmin, null);

            const first = await store.dispatch(getPlansThunk({ offer: 'demo' }));
            const second = await store.dispatch(getPlansThunk({ offer: 'demo' }));

            expect(getPlansRequests()).toHaveLength(3);
            expect(second).toBe(first);
        });

        it('loads the plans again when asked to skip the stored ones', async () => {
            const { store } = setup();
            await store.dispatch(getPlansThunk({ offer: 'demo' }));

            mockPlans.USD = [{ ...offerPlan, Currency: 'USD', Pricing: { 1: 99 } } as Plan];
            const result = await store.dispatch(getPlansThunk({ offer: 'demo', cache: CacheType.None }));

            expect(getPlansRequests()).toHaveLength(6);
            expect(result.plans[0].Pricing).toEqual({ 1: 99 });
        });

        it('stores different offers side by side', async () => {
            const { store } = setup();

            const demo = await store.dispatch(getPlansThunk({ offer: 'demo' }));
            const other = await store.dispatch(getPlansThunk({ offer: 'other' }));

            expect(getPlansRequests().map((params) => params.Offer)).toEqual([
                'demo',
                'demo',
                'demo',
                'other',
                'other',
                'other',
            ]);
            expect(Object.values(store.getState().plansWithOffer).map((entry) => entry?.value)).toEqual([demo, other]);
            expect(await store.dispatch(getPlansThunk({ offer: 'demo' }))).toBe(demo);
            expect(getPlansRequests()).toHaveLength(6);
        });

        it('shares the requests of calls made at the same time for the same offer', async () => {
            const { store } = setup();

            const [first, second] = await Promise.all([
                store.dispatch(getPlansThunk({ offer: 'demo' })),
                store.dispatch(getPlansThunk({ offer: 'DEMO' })),
            ]);

            expect(getPlansRequests()).toHaveLength(3);
            expect(second).toBe(first);
        });

        it('does not share the requests of calls made at the same time for another subscription', async () => {
            const getSubscription = (secondaryPeriodEnd: number) =>
                ({
                    ...defaultSubscription,
                    Plans: [{ Name: PLANS.MAIL }],
                    SecondarySubscriptions: [
                        { Currency: 'USD', Plans: [{ Name: PLANS.LUMO }], PeriodEnd: secondaryPeriodEnd },
                    ],
                }) as Subscription;
            const current = setup(defaultPaymentStatus, defaultUser, getSubscription(1));
            const changed = setup(defaultPaymentStatus, defaultUser, getSubscription(2));

            await Promise.all([
                current.store.dispatch(getPlansThunk({ offer: 'demo' })),
                changed.store.dispatch(getPlansThunk({ offer: 'demo' })),
            ]);

            expect(getPlansRequests()).toHaveLength(6);
        });

        it('drops the stored offers when the regular plans are loaded', async () => {
            const { store } = setup();
            await store.dispatch(getPlansThunk({ offer: 'demo' }));

            await store.dispatch(plansThunk());

            expect(store.getState().plansWithOffer).toEqual({});
        });

        it('rejects and keeps the error out of the regular plans when the request fails', async () => {
            const { store } = setup();
            apiMock.mockImplementationOnce(() => Promise.reject(new Error('failed')));

            await expect(store.dispatch(getPlansThunk({ offer: 'demo' }))).rejects.toThrow('failed');

            expect(selectPlans(store.getState()).error).toBeUndefined();
            expect(Object.values(store.getState().plansWithOffer).map((entry) => entry?.value)).toEqual([undefined]);
        });

        it('picks the plans with the offer when there is one', async () => {
            const { store } = setup();

            await store.dispatch(getPlansThunk({ offer: ' demo ' }));

            expect(getPlansRequests().map((params) => params.Offer)).toEqual(['demo', 'demo', 'demo']);
            expect(selectPlans(store.getState()).value).toBeUndefined();
        });

        it('picks the regular plans for a blank or missing offer', async () => {
            const { store } = setup();

            const blank = await store.dispatch(getPlansThunk({ offer: ' ' }));
            const missing = await store.dispatch(getPlansThunk());

            expect(getPlansRequests()).toEqual([undefined]);
            expect(selectPlans(store.getState()).value).toBe(blank);
            expect(missing).toBe(blank);
        });
    });
});
