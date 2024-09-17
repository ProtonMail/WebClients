import { type PaymentMethodStatusExtended } from '@proton/payments';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { PLANS } from '@proton/shared/lib/constants';
import { type Currency, type Plan, type SubscriptionModel, type UserModel } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { paymentStatusReducer } from '../paymentStatus';
import { type SubscriptionState, subscriptionReducer } from '../subscription';
import { getModelState } from '../test';
import { userReducer } from '../user';
import { plansReducer, plansThunk, selectPlans } from './index';

describe('plans', () => {
    let mockPlans: Record<Currency, Plan[]>;

    let mockDefaultCurrency: Currency = 'USD';

    beforeEach(() => {
        jest.clearAllMocks();
        mockPlans = {
            USD: [],
            EUR: [],
            CHF: [],
            BRL: [],
        };
        mockDefaultCurrency = 'USD';
    });

    const apiMock = jest.fn().mockImplementation(({ url, params }) => {
        // handling free plan route
        if (url.includes('plans/default')) {
            // we reject this call, because the helper for free plan includes the hardcoded fallback that we will use
            // as free plan state in these tests
            return Promise.reject();
        }

        if (url.includes('plans')) {
            const currency = params?.Currency ?? mockDefaultCurrency;
            return Promise.resolve({ Plans: mockPlans[currency as Currency] });
        }
    });

    const defaultStatus: PaymentMethodStatusExtended = {
        CountryCode: 'CH',
        State: null,
        VendorStates: {
            Card: true,
            Cash: true,
            Paypal: true,
            Apple: true,
            Bitcoin: true,
        },
    };

    const defaultUser = {
        Currency: 'USD',
    } as UserModel;

    const defaultSubscription = {
        Currency: 'USD',
    } as SubscriptionModel;

    const setup = (
        status: PaymentMethodStatusExtended = defaultStatus,
        user: UserModel = defaultUser,
        subscription: SubscriptionModel = defaultSubscription
    ) => {
        const extraThunkArguments = {
            api: apiMock,
        } as unknown as ProtonThunkArguments;

        const subscriptionState: SubscriptionState['subscription'] = {
            ...getModelState(subscription),
            meta: {
                ...getModelState(subscription).meta,
                type: 1,
            },
        };

        return getTestStore({
            reducer: { ...userReducer, ...paymentStatusReducer, ...subscriptionReducer, ...plansReducer },
            preloadedState: {
                user: getModelState(user),
                paymentStatus: getModelState(status),
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

    it('should fetch BRL plans', async () => {
        const { store } = setup({ ...defaultStatus, CountryCode: 'BR' });

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
});
