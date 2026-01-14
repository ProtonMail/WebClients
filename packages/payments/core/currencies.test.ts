import type { User, UserModel } from '@proton/shared/lib/interfaces';
import { getTestPlans } from '@proton/testing/data';

import { FREE_SUBSCRIPTION, PLANS } from './constants';
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
import type { Plan } from './plan/interface';
import type { Subscription } from './subscription/interface';

describe('currencies', () => {
    describe('getPreferredCurrency', () => {
        it.each(mainCurrencies)('should always respect param when currency is main - %s', (currency) => {
            const status: PaymentStatus = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    paymentStatus: status,
                    paramCurrency: currency,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    paramCurrency: 'BRL',
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    paramCurrency: 'BRL',
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    paramCurrency: 'BRL',
                    enableNewBatchCurrencies: false,
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
                        paymentStatus: status,
                        paramCurrency: Currency,
                        user,
                        enableNewBatchCurrencies: false,
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
                        subscription,
                        enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    paramPlanName: PLANS.VPN_BUSINESS,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    paramPlanName: PLANS.VPN_BUSINESS,
                    paramCurrency: 'BRL',
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    user,
                    plans,
                    paramPlanName,
                    enableNewBatchCurrencies: false,
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
                VendorStates: {
                    Apple: true,
                    Bitcoin: true,
                    Card: true,
                    InApp: false,
                    Paypal: true,
                    Cash: true,
                    Google: true,
                },
            };

            expect(
                getPreferredCurrency({
                    user,
                    plans,
                    subscription,
                    paymentStatus: status,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    paramPlanName: PLANS.FREE,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                        paymentStatus: status,
                        user,
                        paramCurrency: mainCurrencyParam,
                        enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    user,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    paymentStatus: status,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    plans,
                    enableNewBatchCurrencies: false,
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
                    subscription,
                    plans,
                    enableNewBatchCurrencies: false,
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
        expect(getStatusCurrency(undefined, user, false)).toBeUndefined();
    });

    it('should return the currency from the status if user is undefined', () => {
        const status: PaymentStatus = {
            CountryCode: 'BR',
            VendorStates: {} as any,
        };
        expect(getStatusCurrency(status, undefined, false)).toEqual('BRL');
    });

    it('should return undefined if both paymentStatus and user are undefined', () => {
        expect(getStatusCurrency(undefined, undefined, false)).toBeUndefined();
    });

    it('should return regional currency if both paymentStatus and user exist and country has regional currency', () => {
        const status: PaymentStatus = {
            CountryCode: 'BR',
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user, false)).toBe('BRL');
    });

    it('should return GBP for GB country code', () => {
        const status: PaymentStatus = {
            CountryCode: 'GB',
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user, false)).toBe('GBP');
    });

    it('should return undefined if country does not have regional currency', () => {
        const status: PaymentStatus = {
            CountryCode: 'US',
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user, false)).toBeUndefined();
    });

    it('should return undefined if country code is undefined', () => {
        const status: PaymentStatus = {
            CountryCode: undefined as any,
            VendorStates: {} as any,
        };
        const user = {} as User;

        expect(getStatusCurrency(status, user, false)).toBeUndefined();
    });
});
