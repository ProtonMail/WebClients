import { ChargebeeEnabled, type User, type UserModel } from '@proton/shared/lib/interfaces';
import { getTestPlans } from '@proton/testing/data';

import { ADDON_NAMES, DEFAULT_CURRENCY, FREE_SUBSCRIPTION, PLANS } from './constants';
import {
    fixPlanIDs,
    fixPlanName,
    getAvailableCurrencies,
    getPreferredCurrency,
    getSupportedRegionalCurrencies,
    isRegionalCurrency,
    mainCurrencies,
} from './helpers';
import { type PaymentStatus } from './interface';
import { type Plan } from './plan/interface';
import { type Subscription } from './subscription/interface';

describe('payments core helpers', () => {
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
                    enableNewBatchCurrencies: true,
                })
            ).toEqual(currency);
        });

        it('should respect BRL param if status currency is the same', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    paymentStatus: status,
                    paramCurrency: 'BRL',
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
                })
            ).toEqual('EUR');
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
                        enableNewBatchCurrencies: true,
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
                        enableNewBatchCurrencies: true,
                    })
                ).toEqual(Currency);
            }
        );

        it('should return regional currency if there is no param currency', () => {
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
                })
            ).toEqual(DEFAULT_CURRENCY);
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
                })
            ).toEqual('JPY');
        });

        it('should not show regional currencies to inhouse forced users', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    paymentStatus: status,
                    user: {
                        Currency: 'USD',
                        ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
                        isPaid: true,
                    } as UserModel,
                    enableNewBatchCurrencies: true,
                })
            ).toEqual('USD');
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
                })
            ).toEqual('EUR');
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
                },
            };

            expect(
                getPreferredCurrency({
                    user,
                    plans,
                    subscription,
                    paymentStatus: status,
                    enableNewBatchCurrencies: true,
                })
            ).toEqual('CHF');
        });

        it('should return regional currency if plans have it and status has it even if the feature flag is disable (backend-lead behaviour)', () => {
            const status = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const plans = [
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
                    enableNewBatchCurrencies: true,
                    paramPlanName: PLANS.FREE,
                })
            ).toEqual('BRL');
        });
    });

    describe('getAvailableCurrencies', () => {
        it('should return regional currency', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getAvailableCurrencies({
                    paymentStatus: status,
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                        enableNewBatchCurrencies: true,
                    })
                ).toEqual(['USD', 'EUR', 'CHF']);
            }
        );
    });

    describe('getSupportedRegionalCurrencies', () => {
        it('should return empty arre if user inhouse forced', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    paymentStatus: status,
                    user: {
                        Currency: 'ARS' as any,
                        ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
                    } as User,
                    enableNewBatchCurrencies: true,
                })
            ).toEqual([]);
        });

        it('should return regional currency if regional currencies', () => {
            const status: PaymentStatus = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    paymentStatus: status,
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
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
                    enableNewBatchCurrencies: true,
                })
            ).toEqual(['GBP', 'BRL']);
        });
    });

    it('should return regional currency if plans have it and status has it even if the feature flag is disable (backend-lead behaviour)', () => {
        const status = {
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

describe('fixPlanName', () => {
    it('should convert VPN to VPN2024', () => {
        expect(fixPlanName(PLANS.VPN, 'test')).toBe(PLANS.VPN2024);
    });

    it('should return same plan name for non-VPN plans', () => {
        expect(fixPlanName(PLANS.MAIL, 'test')).toBe(PLANS.MAIL);
        expect(fixPlanName(PLANS.VPN2024, 'test')).toBe(PLANS.VPN2024);
    });

    it('should handle undefined input', () => {
        expect(fixPlanName(undefined, 'test')).toBe(undefined);
    });

    it('should handle null input', () => {
        expect(fixPlanName(null, 'test')).toBe(null);
    });
});

describe('fixPlanIDs', () => {
    it('should convert VPN to VPN2024 in plan IDs', () => {
        const input = {
            [PLANS.VPN]: 1,
        };
        const expected = {
            [PLANS.VPN2024]: 1,
        };
        expect(fixPlanIDs(input, 'test')).toEqual(expected);
    });

    it('should return undefined if input is undefined', () => {
        expect(fixPlanIDs(undefined, 'test')).toBe(undefined);
    });

    it('should return the same object if input does not contain VPN plan', () => {
        const input = {
            [PLANS.MAIL]: 1,
        };
        expect(fixPlanIDs(input, 'test')).toBe(input);
    });

    it('should handle empty plan IDs object', () => {
        expect(fixPlanIDs({}, 'test')).toEqual({});
    });

    it('should preserve other plan IDs', () => {
        const input = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
        };
        const expected = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
        };
        expect(fixPlanIDs(input, 'test')).toEqual(expected);
    });

    it('should handle errors gracefully', () => {
        // Testing the try-catch block by passing an object that will throw when spread
        const malformedInput = Object.create(null);
        Object.defineProperty(malformedInput, PLANS.VPN, {
            get() {
                throw new Error('Test error');
            },
        });
        expect(fixPlanIDs(malformedInput as any, 'test')).toBe(malformedInput);
    });
});
