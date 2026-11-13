import type { User, UserModel } from '@proton/shared/lib/interfaces/User';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../testing/buildSubscription';
import { getTestPlans } from '../testing/data-plans';
import { DEFAULT_PAYMENT_VENDOR_STATES, FREE_SUBSCRIPTION, PLANS } from './constants';
import {
    getAvailableCurrencies,
    getCurrencyFormattingConfig,
    getDefaultMainCurrency,
    getDefaultMainCurrencyByCountryCode,
    getFallbackCurrency,
    getNaiveCurrencyRate,
    getPreferredCurrency,
    getStatusCurrency,
    getSupportedRegionalCurrencies,
    isMainCurrency,
    isRegionalCurrency,
    mainCurrencies,
    mapCountryToRegionalCurrency,
    mapRegionalCurrencyToCountry,
} from './currencies';
import type { Currency, PaymentStatus } from './interface';
import type { Subscription } from './subscription/interface';
import { noSubscriptionContext, toSubscriptionList } from './subscription/multi-subscription-context';

describe('currencies', () => {
    describe('getPreferredCurrency', () => {
        it.each(mainCurrencies)('should always respect param when currency is main - %s', (currency) => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    paramCurrency: currency,
                })
            ).toEqual(currency);
        });

        it('should respect BRL param if status currency is the same', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
            } as UserModel;

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    paramCurrency: 'BRL',
                    user,
                })
            ).toEqual('BRL');
        });

        it('should respect BRL param if status currency is the same and there is no user', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    paramCurrency: 'BRL',
                })
            ).toEqual('BRL');
        });

        it('should return fallback currency if BRL is requested via param but status currency is not BRL', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    paramCurrency: 'BRL',
                })
            ).toEqual('USD');
        });

        const regionalCurrencies = ['BRL', 'JPY', 'RANDOM'];

        it.each(regionalCurrencies)(
            'should accept regional param currency if user has this currency already - %s',
            (Currency: any) => {
                const user = {
                    Currency,
                    isPaid: true,
                } as UserModel;

                const status: PaymentStatus = {
                    CountryCode: 'US',
                    VendorStates: {} as any,
                };

                expect(
                    getPreferredCurrency({
                        multiSubscriptionContext: noSubscriptionContext,
                        paymentStatus: status,
                        paramCurrency: Currency,
                        user,
                    })
                ).toEqual(Currency);
            }
        );

        it.each(regionalCurrencies)(
            'should accept regional param currency if subscription has this currency already - %s',
            (Currency: any) => {
                const user = {
                    Currency: 'USD',
                    isPaid: true,
                } as UserModel;

                const subscription = {
                    Currency,
                } as Subscription;

                const status: PaymentStatus = {
                    CountryCode: 'US',
                    VendorStates: {} as any,
                };

                expect(
                    getPreferredCurrency({
                        paymentStatus: status,
                        paramCurrency: Currency,
                        user,
                        multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                    })
                ).toEqual(Currency);
            }
        );

        it('should return regional currency if there is no param currency and no user', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'USD',
                },
                {
                    Currency: 'BRL',
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                })
            ).toEqual('BRL');
        });

        it('should return regional currency if there is no param currency but user has it', () => {
            const user = {
                Currency: 'BRL',
            } as UserModel;

            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'USD',
                },
                {
                    Currency: 'BRL',
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                    plans,
                })
            ).toEqual('BRL');
        });

        it('should return fallback currency if plans are provided but do not have the regional currency', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'USD',
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                })
            ).toEqual('USD');
        });

        it('should return the fallback currency if status is not regional', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'JPY' as any,
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                })
            ).toEqual('USD');
        });

        it('should return main currency from the plan as a fallback', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'JPY' as any,
                },
                {
                    Currency: 'USD' as any,
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                })
            ).toEqual('USD');
        });

        it('should return the subscription currency if subscription is present', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'USD',
            } as Subscription;

            expect(
                getPreferredCurrency({
                    paymentStatus: status,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                })
            ).toEqual('USD');
        });

        it('should return the subscription currency if status is not regional', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'JPY' as any,
            } as Subscription;

            const plans = [
                {
                    Currency: 'USD',
                },
                {
                    Currency: 'JPY' as any,
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    paymentStatus: status,
                    plans,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                })
            ).toEqual('JPY');
        });

        it('should return user currency if user is paid', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'USD',
                isPaid: true,
            } as UserModel;

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                })
            ).toEqual('USD');
        });

        it('should return user currency if user has regional currency', () => {
            const status: PaymentStatus = {
                CountryCode: 'CH',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
                isPaid: true,
            } as UserModel;

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                })
            ).toEqual('BRL');
        });

        it('should return user currency if user has positive balance', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'USD',
                isPaid: false,
                Credit: 1,
            } as UserModel;

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                })
            ).toEqual('USD');
        });

        it('should return status currency if user is free and has no credits', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'USD',
                isPaid: false,
                Credit: 0,
            } as UserModel;

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                })
            ).toEqual('BRL');
        });

        it('should return the user currency if status is not regional', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'JPY' as any,
                isPaid: true,
            } as UserModel;

            const plans = [
                {
                    Currency: 'USD',
                },
                {
                    Currency: 'JPY',
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                    user,
                })
            ).toEqual('JPY');
        });

        it('should use fallback currency if plan param does not support the currency', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'USD',
                    Name: PLANS.VPN_BUSINESS,
                },
                {
                    Currency: 'BRL',
                    Name: PLANS.VPN2024,
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                    paramPlanName: PLANS.VPN_BUSINESS,
                })
            ).toEqual('USD');
        });

        it('should use fallback currency if plan param does not support the currency even if the param currency is provided', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'USD',
                    Name: PLANS.VPN_BUSINESS,
                },
                {
                    Currency: 'BRL',
                    Name: PLANS.VPN2024,
                },
            ] as Plan[];

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                    paramPlanName: PLANS.VPN_BUSINESS,
                    paramCurrency: 'BRL',
                })
            ).toEqual('USD');
        });

        it('should select the fallback currency in case if selected plan does not support regional currency', () => {
            // VPN2024 has BRL but bundlepro doesn't
            const plans = [
                {
                    Currency: 'USD',
                    Name: PLANS.BUNDLE_PRO_2024,
                },
                {
                    Currency: 'EUR',
                    Name: PLANS.BUNDLE_PRO_2024,
                },
                {
                    Currency: 'CHF',
                    Name: PLANS.BUNDLE_PRO_2024,
                },
                {
                    Currency: 'USD',
                    Name: PLANS.VPN2024,
                },
                {
                    Currency: 'EUR',
                    Name: PLANS.VPN2024,
                },
                {
                    Currency: 'CHF',
                    Name: PLANS.VPN2024,
                },
                {
                    Currency: 'BRL',
                    Name: PLANS.VPN2024,
                },
            ] as Plan[];

            const status = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            } as PaymentStatus;

            const user = {
                Currency: 'BRL',
                isPaid: true,
            } as UserModel;

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            const paramPlanName = PLANS.BUNDLE_PRO_2024;

            expect(
                getPreferredCurrency({
                    paymentStatus: status,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                    user,
                    plans,
                    paramPlanName,
                })
            ).toEqual('USD');
        });

        it('should return user currency if user is free, plans are undefined, subscription is free and status does not have preferred currency', () => {
            const user = {
                Currency: 'CHF',
                isPaid: false,
                Credit: 0,
            } as UserModel;

            const subscription = FREE_SUBSCRIPTION;

            const plans = undefined;

            const status = {
                // non-existent country code to make sure that this test doesn't break
                // as we add more regional currencies and countries
                CountryCode: 'XX',
                State: null,
                VendorStates: DEFAULT_PAYMENT_VENDOR_STATES,
            };

            expect(
                getPreferredCurrency({
                    user,
                    plans,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                    paymentStatus: status,
                })
            ).toEqual('CHF');
        });

        it('should return regional currency if free plan is selected', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = getTestPlans('BRL');

            expect(
                getPreferredCurrency({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                    paramPlanName: PLANS.FREE,
                })
            ).toEqual('BRL');
        });
    });

    describe('getAvailableCurrencies', () => {
        it('should return regional currency if only status is provided (without user)', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should return regional currency if user is provided', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'USD',
            } as User;

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should not return regional currency if plans do not have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'USD',
                },
            ] as Plan[];

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                })
            ).toEqual(['USD', 'EUR', 'CHF']);
        });

        it('should return regional currency if plans have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'BRL',
                },
            ] as Plan[];

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    plans,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should return regional currency when user has it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
            } as User;

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should not return regional currency when user has it and plans do not have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
            } as User;

            const plans = [
                {
                    Currency: 'USD',
                },
            ] as Plan[];

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                    plans,
                })
            ).toEqual(['USD', 'EUR', 'CHF']);
        });

        it('should return regional currency when user has it and plans have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
            } as User;

            const plans = [
                {
                    Currency: 'BRL',
                },
            ] as Plan[];

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                    plans,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should return regional currency when subscription has it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            expect(
                getAvailableCurrencies({
                    paymentStatus: status,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should not return regional currency when subscription has it and plans do not have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            const plans = [
                {
                    Currency: 'USD',
                },
            ] as Plan[];

            expect(
                getAvailableCurrencies({
                    paymentStatus: status,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                    plans,
                })
            ).toEqual(['USD', 'EUR', 'CHF']);
        });

        it('should return regional currency when subscription has it and plans have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            const plans = [
                {
                    Currency: 'BRL',
                },
            ] as Plan[];

            expect(
                getAvailableCurrencies({
                    paymentStatus: status,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
                    plans,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should return two regional currencies if status and user have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'ARS' as any,
            } as User;

            expect(
                getAvailableCurrencies({
                    multiSubscriptionContext: noSubscriptionContext,
                    paymentStatus: status,
                    user,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL', 'ARS']);
        });

        it.each(mainCurrencies)(
            'should return only the main currencies if user provides main currency as currency param - %s',
            (mainCurrencyParam) => {
                const status: PaymentStatus = {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                };

                const user = {
                    Currency: 'USD',
                } as User;

                expect(
                    getAvailableCurrencies({
                        multiSubscriptionContext: noSubscriptionContext,
                        paymentStatus: status,
                        user,
                        paramCurrency: mainCurrencyParam,
                    })
                ).toEqual(['USD', 'EUR', 'CHF']);
            }
        );
    });

    describe('getSupportedRegionalCurrencies', () => {
        it('should return regional currency if only status is provided (without user)', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    subscriptions: [],
                    paymentStatus: status,
                })
            ).toEqual(['BRL']);
        });

        it('should return regional currency if user is provided', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'USD',
            } as User;

            expect(
                getSupportedRegionalCurrencies({
                    subscriptions: [],
                    paymentStatus: status,
                    user,
                })
            ).toEqual(['BRL']);
        });

        it('should return regional currency if user has it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
            } as User;

            expect(
                getSupportedRegionalCurrencies({
                    subscriptions: [],
                    paymentStatus: status,
                    user,
                })
            ).toEqual(['BRL']);
        });

        it('should return regional currency if subscription has it', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            expect(
                getSupportedRegionalCurrencies({
                    paymentStatus: status,
                    subscriptions: toSubscriptionList(subscription),
                })
            ).toEqual(['BRL']);
        });

        it('should return regional currency if plans have it', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'BRL',
                },
            ] as Plan[];

            expect(
                getSupportedRegionalCurrencies({
                    subscriptions: [],
                    paymentStatus: status,
                    plans,
                })
            ).toEqual(['BRL']);
        });

        it('should not return regional currency if plans have it but status does not', () => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'BRL',
                },
            ] as Plan[];

            expect(
                getSupportedRegionalCurrencies({
                    subscriptions: [],
                    paymentStatus: status,
                    plans,
                })
            ).toEqual([]);
        });

        it('should not return regional currencies if status has it but plans do not', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'USD',
                },
            ] as Plan[];

            expect(
                getSupportedRegionalCurrencies({
                    subscriptions: [],
                    paymentStatus: status,
                    plans,
                })
            ).toEqual([]);
        });

        it.each([
            {
                case: 'Status and user',
                status: {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'ARS' as any,
                } as User,
                subscription: undefined,
                plans: undefined,
                expected: ['BRL', 'ARS'],
            },
            {
                case: 'Status and subscription',
                status: {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'USD',
                } as User,
                subscription: {
                    Currency: 'ARS' as any,
                } as Subscription,
                plans: undefined,
                expected: ['BRL', 'ARS'],
            },
            {
                case: 'User and subscription',
                status: {
                    CountryCode: 'US',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'ARS' as any,
                } as User,
                subscription: {
                    Currency: 'BRL',
                } as Subscription,
                plans: undefined,
                expected: ['BRL', 'ARS'],
            },
            {
                case: 'Status and user, plans have both',
                status: {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'ARS' as any,
                } as User,
                subscription: undefined,
                plans: [
                    {
                        Currency: 'BRL',
                    },
                    {
                        Currency: 'ARS' as any,
                    },
                ] as Plan[],
                expected: ['BRL', 'ARS'],
            },
            {
                case: 'Status and subscription, plans have both',
                status: {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'USD',
                } as User,
                subscription: {
                    Currency: 'ARS' as any,
                } as Subscription,
                plans: [
                    {
                        Currency: 'BRL',
                    },
                    {
                        Currency: 'ARS' as any,
                    },
                ] as Plan[],
                expected: ['BRL', 'ARS'],
            },
            {
                case: 'User and subscription, plans have both',
                status: {
                    CountryCode: 'US',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'ARS' as any,
                } as User,
                subscription: {
                    Currency: 'BRL',
                } as Subscription,
                plans: [
                    {
                        Currency: 'BRL',
                    },
                    {
                        Currency: 'ARS' as any,
                    },
                ] as Plan[],
                expected: ['BRL', 'ARS'],
            },
            {
                case: 'Status and user, plans have only status',
                status: {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'ARS' as any,
                } as User,
                subscription: undefined,
                plans: [
                    {
                        Currency: 'BRL',
                    },
                ] as Plan[],
                expected: ['BRL'],
            },
            {
                case: 'Status and subscription, plans have only status',
                status: {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'USD',
                } as User,
                subscription: {
                    Currency: 'ARS' as any,
                } as Subscription,
                plans: [
                    {
                        Currency: 'BRL',
                    },
                ] as Plan[],
                expected: ['BRL'],
            },
            {
                case: 'User and subscription, plans have only user',
                status: {
                    CountryCode: 'US',
                    VendorStates: {} as any,
                },
                user: {
                    Currency: 'ARS' as any,
                } as User,
                subscription: {
                    Currency: 'BRL',
                } as Subscription,
                plans: [
                    {
                        Currency: 'ARS' as any,
                    },
                ] as Plan[],
                expected: ['ARS'],
            },
        ])(`should return two regional currencies - case $case`, ({ status, user, subscription, plans, expected }) => {
            expect(
                getSupportedRegionalCurrencies({
                    paymentStatus: status,
                    user,
                    subscriptions: toSubscriptionList(subscription),
                    plans,
                })
            ).toEqual(expected);
        });

        it('should not duplicated regional currencies', () => {
            const status = {
                CountryCode: 'GB',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'BRL',
                },
                {
                    Currency: 'GBP',
                },
                {
                    Currency: 'USD',
                },
                {
                    Currency: 'CHF',
                },
                {
                    Currency: 'EUR',
                },
            ] as Plan[];

            const user = {
                Currency: 'BRL',
            } as User;

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            expect(
                getSupportedRegionalCurrencies({
                    paymentStatus: status,
                    user,
                    subscriptions: toSubscriptionList(subscription),
                    plans,
                })
            ).toEqual(['GBP', 'BRL']);
        });
    });
});

describe('getCurrencyFormattingConfig', () => {
    it('should return correct config for EUR', () => {
        expect(getCurrencyFormattingConfig('EUR')).toEqual({
            symbolPosition: 'suffix-space',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for CHF', () => {
        expect(getCurrencyFormattingConfig('CHF')).toEqual({
            symbolPosition: 'prefix-space',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for USD', () => {
        expect(getCurrencyFormattingConfig('USD')).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for BRL', () => {
        expect(getCurrencyFormattingConfig('BRL')).toEqual({
            symbolPosition: 'prefix-space',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for GBP', () => {
        expect(getCurrencyFormattingConfig('GBP')).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for CAD', () => {
        expect(getCurrencyFormattingConfig('CAD')).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for AUD', () => {
        expect(getCurrencyFormattingConfig('AUD')).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for SGD', () => {
        expect(getCurrencyFormattingConfig('SGD')).toEqual({
            symbolPosition: 'prefix-space',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for HKD', () => {
        expect(getCurrencyFormattingConfig('HKD')).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should return correct config for JPY', () => {
        expect(getCurrencyFormattingConfig('JPY')).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 0,
            divisor: 1,
        });
    });

    it('should return correct config for KRW', () => {
        expect(getCurrencyFormattingConfig('KRW')).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 0,
            divisor: 1,
        });
    });

    it('should return correct config for PLN', () => {
        expect(getCurrencyFormattingConfig('PLN')).toEqual({
            symbolPosition: 'suffix-space',
            decimalPoints: 2,
            divisor: 100,
        });
    });

    it('should fallback to USD config for unknown currencies', () => {
        expect(getCurrencyFormattingConfig('XXX' as any)).toEqual({
            symbolPosition: 'prefix-nospace',
            decimalPoints: 2,
            divisor: 100,
        });
    });
});

describe('isRegionalCurrency', () => {
    it('should return true if currency is regional', () => {
        expect(isRegionalCurrency('USD')).toBe(false);
        expect(isRegionalCurrency('EUR')).toBe(false);
        expect(isRegionalCurrency('CHF')).toBe(false);
        expect(isRegionalCurrency('BRL')).toBe(true);
        expect(isRegionalCurrency('JPY' as any)).toBe(true);
    });
});

describe('getDefaultMainCurrencyByCountryCode', () => {
    it('should return USD for undefined country code', () => {
        expect(getDefaultMainCurrencyByCountryCode(undefined)).toBe('USD');
    });

    it('should return USD for unknown country code', () => {
        expect(getDefaultMainCurrencyByCountryCode('XX')).toBe('USD');
    });

    it('should return CHF for Switzerland', () => {
        expect(getDefaultMainCurrencyByCountryCode('CH')).toBe('CHF');
    });

    it('should return EUR for EU countries', () => {
        const euCountries = [
            'AT',
            'BE',
            'BG',
            'HR',
            'CY',
            'CZ',
            'DK',
            'EE',
            'FI',
            'FR',
            'DE',
            'GR',
            'IE',
            'IT',
            'LV',
            'LT',
            'LU',
            'MT',
            'NL',
            'PT',
            'RO',
            'SK',
            'SI',
            'ES',
            'SE',
        ];
        euCountries.forEach((country) => {
            expect(getDefaultMainCurrencyByCountryCode(country)).toBe('EUR');
        });
    });

    it('should return EUR for other countries with EUR fallback', () => {
        const eurFallbackCountries = ['IS', 'LI', 'NO', 'GB', 'AD', 'MC', 'SM', 'VA'];
        eurFallbackCountries.forEach((country) => {
            expect(getDefaultMainCurrencyByCountryCode(country)).toBe('EUR');
        });
    });

    it('should return USD for countries without fallback', () => {
        expect(getDefaultMainCurrencyByCountryCode('US')).toBe('USD');
        expect(getDefaultMainCurrencyByCountryCode('HU')).toBe('USD');
        expect(getDefaultMainCurrencyByCountryCode('PL')).toBe('USD');
        expect(getDefaultMainCurrencyByCountryCode('MK')).toBe('USD');
        expect(getDefaultMainCurrencyByCountryCode('TR')).toBe('USD');
        expect(getDefaultMainCurrencyByCountryCode('SG')).toBe('USD');
    });
});

describe('getDefaultMainCurrency', () => {
    it('should return USD for undefined payment status', () => {
        expect(getDefaultMainCurrency(undefined)).toBe('USD');
    });

    it('should extract country code from PaymentStatus', () => {
        const status: PaymentStatus = {
            CountryCode: 'CH',
            VendorStates: {} as any,
        };
        expect(getDefaultMainCurrency(status)).toBe('CHF');
    });

    it('should extract country code from BillingAddress', () => {
        const billingAddress = {
            CountryCode: 'DE',
        };
        expect(getDefaultMainCurrency(billingAddress)).toBe('EUR');
    });

    it('should handle undefined CountryCode', () => {
        const status: PaymentStatus = {
            CountryCode: undefined as any,
            VendorStates: {} as any,
        };
        expect(getDefaultMainCurrency(status)).toBe('USD');
    });
});

describe('isMainCurrency', () => {
    it('should return true for main currencies', () => {
        expect(isMainCurrency('USD')).toBe(true);
        expect(isMainCurrency('EUR')).toBe(true);
        expect(isMainCurrency('CHF')).toBe(true);
    });

    it('should return false for regional currencies', () => {
        expect(isMainCurrency('BRL')).toBe(false);
        expect(isMainCurrency('GBP')).toBe(false);
        expect(isMainCurrency('JPY')).toBe(false);
        expect(isMainCurrency('KRW')).toBe(false);
    });
});

describe('mapCountryToRegionalCurrency', () => {
    it('should map country codes to their regional currencies', () => {
        expect(mapCountryToRegionalCurrency('BR')).toBe('BRL');
        expect(mapCountryToRegionalCurrency('GB')).toBe('GBP');
        expect(mapCountryToRegionalCurrency('AU')).toBe('AUD');
        expect(mapCountryToRegionalCurrency('CA')).toBe('CAD');

        expect(mapCountryToRegionalCurrency('JP')).toBe('JPY');
        expect(mapCountryToRegionalCurrency('KR')).toBe('KRW');
        expect(mapCountryToRegionalCurrency('PL')).toBe('PLN');
        expect(mapCountryToRegionalCurrency('SG')).toBe('SGD');
        expect(mapCountryToRegionalCurrency('HK')).toBe('HKD');
    });

    it('should return undefined for countries without regional currencies', () => {
        expect(mapCountryToRegionalCurrency('US')).toBeUndefined();
        expect(mapCountryToRegionalCurrency('DE')).toBeUndefined();
        expect(mapCountryToRegionalCurrency('XX')).toBeUndefined();
    });
});

describe('mapRegionalCurrencyToCountry', () => {
    it('should map regional currencies to their countries', () => {
        expect(mapRegionalCurrencyToCountry('BRL')).toBe('BR');
        expect(mapRegionalCurrencyToCountry('GBP')).toBe('GB');
        expect(mapRegionalCurrencyToCountry('AUD')).toBe('AU');
        expect(mapRegionalCurrencyToCountry('CAD')).toBe('CA');
        expect(mapRegionalCurrencyToCountry('JPY')).toBe('JP');
        expect(mapRegionalCurrencyToCountry('KRW')).toBe('KR');
        expect(mapRegionalCurrencyToCountry('PLN')).toBe('PL');
        expect(mapRegionalCurrencyToCountry('SGD')).toBe('SG');
        expect(mapRegionalCurrencyToCountry('HKD')).toBe('HK');
    });

    it('should return undefined for main currencies', () => {
        expect(mapRegionalCurrencyToCountry('USD')).toBeUndefined();
        expect(mapRegionalCurrencyToCountry('EUR')).toBeUndefined();
        expect(mapRegionalCurrencyToCountry('CHF')).toBeUndefined();
    });

    it('should return undefined for unknown currencies', () => {
        expect(mapRegionalCurrencyToCountry('XXX' as Currency)).toBeUndefined();
    });
});

describe('getFallbackCurrency', () => {
    it('should return the fallback currency for regional currencies', () => {
        expect(getFallbackCurrency('BRL')).toBe('USD'); // BR -> USD
        expect(getFallbackCurrency('GBP')).toBe('EUR'); // GB -> EUR
        expect(getFallbackCurrency('AUD')).toBe('USD'); // AU -> USD
        expect(getFallbackCurrency('CAD')).toBe('USD'); // CA -> USD
        expect(getFallbackCurrency('JPY')).toBe('USD'); // JP -> USD
        expect(getFallbackCurrency('KRW')).toBe('USD'); // KR -> USD
        expect(getFallbackCurrency('PLN')).toBe('USD'); // PL -> USD
        expect(getFallbackCurrency('SGD')).toBe('USD'); // SG -> USD
        expect(getFallbackCurrency('HKD')).toBe('USD'); // HK -> USD
    });

    it('should return USD for unknown currencies', () => {
        expect(getFallbackCurrency('XXX' as Currency)).toBe('USD');
    });
});

describe('getNaiveCurrencyRate', () => {
    it('should return predefined rates for known currencies', () => {
        expect(getNaiveCurrencyRate('BRL')).toBe(5);
        expect(getNaiveCurrencyRate('PLN')).toBe(5);
        expect(getNaiveCurrencyRate('HKD')).toBe(10);
    });

    it('should return adjusted rates for currencies with different decimal points', () => {
        // JPY should have coversion rate 100. But because it has 0 decimal points instead of 2, we remove two
        // orders of magnitude.
        expect(getNaiveCurrencyRate('JPY')).toBe(1);

        // KRW should have coversion rate 1000. But because it has 0 decimal points instead of 2, we remove two orders
        // of magnitude.
        expect(getNaiveCurrencyRate('KRW')).toBe(10);
    });

    it('should return 1 for unknown currencies', () => {
        expect(getNaiveCurrencyRate('XXX' as Currency)).toBe(1);
    });

    it('should return 1 for main currencies without predefined rates', () => {
        expect(getNaiveCurrencyRate('USD')).toBe(1);
        expect(getNaiveCurrencyRate('EUR')).toBe(1);
        expect(getNaiveCurrencyRate('CHF')).toBe(1);
    });
});

describe('getStatusCurrency', () => {
    it('should return undefined if paymentStatus is undefined', () => {
        const user = {} as User;
        expect(getStatusCurrency(undefined, user)).toBeUndefined();
    });

    it('should return the currency from the status if user is undefined', () => {
        const status: PaymentStatus = {
            CountryCode: 'BR',
            VendorStates: {} as any,
        };
        expect(getStatusCurrency(status, undefined)).toEqual('BRL');
    });

    it('should return undefined if both paymentStatus and user are undefined', () => {
        expect(getStatusCurrency(undefined, undefined)).toBeUndefined();
    });

    it('should return regional currency if both paymentStatus and user exist and country has regional currency', () => {
        const status: PaymentStatus = {
            CountryCode: 'BR',
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user)).toBe('BRL');
    });

    it('should return GBP for GB country code', () => {
        const status: PaymentStatus = {
            CountryCode: 'GB',
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user)).toBe('GBP');
    });

    it('should return undefined if country does not have regional currency', () => {
        const status: PaymentStatus = {
            CountryCode: 'US',
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user)).toBeUndefined();
    });

    it('should return undefined if country code is undefined', () => {
        const status: PaymentStatus = {
            CountryCode: undefined as any,
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user)).toBeUndefined();
    });
});

describe('locked currency for multiple subscriptions', () => {
    const webMailPlusInUsd = buildSubscription(PLANS.MAIL, { Currency: 'USD' });
    const webLumoPlusInUsd = buildLumoSubscription(PLANS.LUMO, { Currency: 'USD' });
    const paymentStatus = { CountryCode: 'CH', VendorStates: {} } as unknown as PaymentStatus;

    it('ignores the URL currency when Lumo is added next to web Mail Plus', () => {
        const multiSubscriptionContext = buildMultiSubscriptionContext([webMailPlusInUsd]);

        expect(
            getPreferredCurrency({
                paramCurrency: 'EUR',
                paramPlanName: PLANS.LUMO,
                paymentStatus,
                multiSubscriptionContext,
            })
        ).toBe('USD');
        expect(
            getAvailableCurrencies({
                selectedPlanName: PLANS.LUMO,
                paymentStatus,
                multiSubscriptionContext,
            })
        ).toEqual(['USD']);
    });

    it('keeps the existing currency for any change with two web subscriptions', () => {
        const multiSubscriptionContext = buildMultiSubscriptionContext([webMailPlusInUsd, webLumoPlusInUsd]);

        expect(
            getPreferredCurrency({
                paramCurrency: 'CHF',
                paymentStatus,
                multiSubscriptionContext,
            })
        ).toBe('USD');
        expect(getAvailableCurrencies({ paymentStatus, multiSubscriptionContext })).toEqual(['USD']);
    });

    it('skips the lock for a plan without a price in the locked currency', () => {
        const webMailPlusInBrl = buildSubscription(PLANS.MAIL, { Currency: 'BRL' });
        const webLumoPlusInBrl = buildLumoSubscription(PLANS.LUMO, { Currency: 'BRL' });
        const multiSubscriptionContext = buildMultiSubscriptionContext([webMailPlusInBrl, webLumoPlusInBrl]);
        const plans = [...getTestPlans('USD'), ...getTestPlans('BRL').filter((plan) => plan.Name !== PLANS.MAIL_PRO)];
        const brazil = { CountryCode: 'BR', VendorStates: {} } as unknown as PaymentStatus;

        expect(
            getPreferredCurrency({
                paramPlanName: PLANS.MAIL_PRO,
                plans,
                paymentStatus: brazil,
                multiSubscriptionContext,
            })
        ).toBe('USD');
        expect(
            getAvailableCurrencies({
                selectedPlanName: PLANS.MAIL_PRO,
                plans,
                paymentStatus: brazil,
                multiSubscriptionContext,
            })
        ).toEqual(['USD', 'EUR', 'CHF']);
        expect(
            getPreferredCurrency({ paramPlanName: PLANS.MAIL, plans, paymentStatus: brazil, multiSubscriptionContext })
        ).toBe('BRL');
    });

    it('keeps the URL currency when the purchase replaces the only web subscription', () => {
        const multiSubscriptionContext = buildMultiSubscriptionContext([webMailPlusInUsd]);

        expect(
            getPreferredCurrency({
                paramCurrency: 'EUR',
                paramPlanName: PLANS.PASS,
                plans: getTestPlans('EUR'),
                paymentStatus,
                multiSubscriptionContext,
            })
        ).toBe('EUR');
    });
});

describe('regional currencies of the selected plan', () => {
    const paymentStatus = { CountryCode: 'BR', VendorStates: {} } as unknown as PaymentStatus;
    const b2cPlansInUsdAndBrl = [...getTestPlans('USD'), ...getTestPlans('BRL')].filter(
        (plan) => plan.Name === PLANS.MAIL || plan.Name === PLANS.BUNDLE
    );

    it('drops a regional currency the selected plan is not sold in', () => {
        const mailPlusInUsdOnly = b2cPlansInUsdAndBrl.filter(
            (plan) => plan.Name !== PLANS.MAIL || plan.Currency === 'USD'
        );

        expect(
            getAvailableCurrencies({
                paymentStatus,
                multiSubscriptionContext: noSubscriptionContext,
                plans: mailPlusInUsdOnly,
                selectedPlanName: PLANS.MAIL,
            })
        ).toEqual(['USD', 'EUR', 'CHF']);
    });
});

describe('getPreferredCurrency when the selected plan changes', () => {
    const webMailPlusInUsd = buildSubscription(PLANS.MAIL, { Currency: 'USD' });
    const webMailPlusInBrl = buildSubscription(PLANS.MAIL, { Currency: 'BRL' });
    const webLumoPlusInUsd = buildLumoSubscription(PLANS.LUMO, { Currency: 'USD' });
    const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, { External: SubscriptionPlatform.iOS });
    const paymentStatus = { CountryCode: 'BR', VendorStates: {} } as unknown as PaymentStatus;
    const plans = [...getTestPlans('USD'), ...getTestPlans('EUR'), ...getTestPlans('CHF'), ...getTestPlans('BRL')];
    const plansWithoutBrlForBusiness = plans.filter(
        (plan) => !(plan.Currency === 'BRL' && plan.Name === PLANS.BUNDLE_PRO_2024)
    );

    const getCurrency = (
        subscriptions: Subscription[],
        currentCurrency: Currency,
        selectedPlanName: PLANS | undefined,
        { lumoMultiSubscriptions = true, availablePlans = plans } = {}
    ) =>
        getPreferredCurrency({
            paramCurrency: currentCurrency,
            paramPlanName: selectedPlanName,
            paymentStatus,
            plans: availablePlans,
            multiSubscriptionContext: buildMultiSubscriptionContext(subscriptions, lumoMultiSubscriptions),
        });

    it('keeps the current currency while it is offered for the selection', () => {
        expect(getCurrency([webMailPlusInUsd], 'EUR', PLANS.PASS)).toBe('EUR');
        expect(getCurrency([webMailPlusInBrl], 'BRL', PLANS.BUNDLE)).toBe('BRL');
    });

    it('switches to the web subscription currency when Lumo is added next to it', () => {
        expect(getCurrency([webMailPlusInUsd], 'EUR', PLANS.LUMO)).toBe('USD');
    });

    it('lets a regional subscriber replace the only web subscription with a business plan in a main currency', () => {
        expect(
            getCurrency([webMailPlusInBrl], 'BRL', PLANS.BUNDLE_PRO_2024, {
                availablePlans: plansWithoutBrlForBusiness,
            })
        ).toBe('USD');
    });

    it('keeps the existing currency for any change with two web subscriptions', () => {
        expect(getCurrency([webMailPlusInUsd, webLumoPlusInUsd], 'CHF', PLANS.PASS)).toBe('USD');
        expect(getCurrency([webMailPlusInUsd, webLumoPlusInUsd], 'CHF', undefined)).toBe('USD');
    });

    it('ignores store subscriptions', () => {
        expect(getCurrency([iosLumoPlus], 'EUR', PLANS.MAIL)).toBe('EUR');
    });

    it('locks nothing with the flag off', () => {
        expect(getCurrency([webMailPlusInUsd], 'EUR', PLANS.LUMO, { lumoMultiSubscriptions: false })).toBe('EUR');
        expect(
            getCurrency([webMailPlusInUsd, webLumoPlusInUsd], 'CHF', PLANS.PASS, { lumoMultiSubscriptions: false })
        ).toBe('CHF');
    });
});
