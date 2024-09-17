import { DEFAULT_CURRENCY, PLANS } from '@proton/shared/lib/constants';
import {
    ChargebeeEnabled,
    type Plan,
    type Subscription,
    type User,
    type UserModel,
} from '@proton/shared/lib/interfaces';

import {
    getAvailableCurrencies,
    getPreferredCurrency,
    getSupportedRegionalCurrencies,
    isRegionalCurrency,
    mainCurrencies,
} from './helpers';
import { type PaymentMethodStatusExtended } from './interface';

describe('payments core helpers', () => {
    describe('getPreferredCurrency', () => {
        it.each(mainCurrencies)('should always respect param when currency is main - %s', (currency) => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    status,
                    paramCurrency: currency,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(currency);
        });

        it('should respect BRL param if status currency is the same', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    status,
                    paramCurrency: 'BRL',
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('BRL');
        });

        it('should return fallback currency if BRL is requested via param but status currency is not BRL', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    status,
                    paramCurrency: 'BRL',
                    regionalCurrenciesEnabled: true,
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

                const status: PaymentMethodStatusExtended = {
                    CountryCode: 'US',
                    VendorStates: {} as any,
                };

                expect(
                    getPreferredCurrency({
                        status,
                        paramCurrency: Currency,
                        user,
                        regionalCurrenciesEnabled: true,
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

                const status: PaymentMethodStatusExtended = {
                    CountryCode: 'US',
                    VendorStates: {} as any,
                };

                expect(
                    getPreferredCurrency({
                        status,
                        paramCurrency: Currency,
                        user,
                        subscription,
                        regionalCurrenciesEnabled: true,
                    })
                ).toEqual(Currency);
            }
        );

        it('should return regional currency if there is no param currency', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('BRL');
        });

        it('should return fallback currency if plans are provided but do not have the regional currency', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('USD');
        });

        it('should return the fallback currency if status is not regional', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(DEFAULT_CURRENCY);
        });

        it('should return main currency from the plan as a fallback - regional currencies enabled', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('USD');
        });

        it('should return main currency from the plan as a fallback - regional currencies disabled', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: false,
                })
            ).toEqual('USD');
        });

        // user > subscription > plans > default

        it('should return the subscription currency if subscription is present', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'USD',
            } as Subscription;

            expect(
                getPreferredCurrency({
                    status,
                    subscription,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('USD');
        });

        it('should return the subscription currency if status is not regional', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    subscription,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('JPY');
        });

        it('should return user currency if user is paid', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'USD',
                isPaid: true,
            } as UserModel;

            expect(
                getPreferredCurrency({
                    status,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('USD');
        });

        it('should return user currency if user has regional currency', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'CH',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
                isPaid: true,
            } as UserModel;

            expect(
                getPreferredCurrency({
                    status,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('BRL');
        });

        it('should return user currency if user has positive balance', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('USD');
        });

        it('should return status currency if user is free and has no credits', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('BRL');
        });

        it('should return the user currency if status is not regional', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('JPY');
        });

        it('should not return regional currency if regional currencies are disabled and it only available from status', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    status,
                    regionalCurrenciesEnabled: false,
                    subscription: {
                        Currency: 'USD',
                    } as Subscription,
                })
            ).toEqual('USD');
        });

        it('should return regional currency if regional currencies are disabled and it is available from subscription', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    status,
                    regionalCurrenciesEnabled: false,
                    subscription: {
                        Currency: 'BRL',
                    } as Subscription,
                })
            ).toEqual('BRL');
        });

        it('should return regional currency if regional currencies are disabled and it is available from user', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    status,
                    regionalCurrenciesEnabled: false,
                    user: {
                        Currency: 'BRL',
                        isPaid: true,
                    } as UserModel,
                })
            ).toEqual('BRL');
        });

        it('should not show regional currencies to inhouse forced users', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getPreferredCurrency({
                    status,
                    regionalCurrenciesEnabled: true,
                    user: {
                        Currency: 'USD',
                        ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
                        isPaid: true,
                    } as UserModel,
                })
            ).toEqual('USD');
        });

        it('should use fallback currency if plan param does not support the currency', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    paramPlanName: PLANS.VPN_BUSINESS,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('USD');
        });

        it('should use fallback currency if plan param does not support the currency even if the param currency is provided', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    paramPlanName: PLANS.VPN_BUSINESS,
                    regionalCurrenciesEnabled: true,
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
            } as PaymentMethodStatusExtended;

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
                    status,
                    subscription,
                    user,
                    plans,
                    paramPlanName,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual('EUR');
        });
    });

    describe('getAvailableCurrencies', () => {
        it('should return regional currency', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getAvailableCurrencies({
                    status,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should not return regional currency if plans do not have it', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF']);
        });

        it('should return regional currency if plans have it', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should return regional currency when user has it', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
            } as User;

            expect(
                getAvailableCurrencies({
                    status,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should not return regional currency when user has it and plans do not have it', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    user,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF']);
        });

        it('should return regional currency when user has it and plans have it', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    user,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should return regional currency when subscription has it', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            expect(
                getAvailableCurrencies({
                    status,
                    subscription,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should not return regional currency when subscription has it and plans do not have it', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    subscription,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF']);
        });

        it('should return regional currency when subscription has it and plans have it', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    subscription,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL']);
        });

        it('should return two regional currencies if status and user have it', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'ARS' as any,
            } as User;

            expect(
                getAvailableCurrencies({
                    status,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['USD', 'EUR', 'CHF', 'BRL', 'ARS']);
        });

        it.each(mainCurrencies)(
            'should return only the main currencies if user provides main currency as currency param - %s',
            (mainCurrencyParam) => {
                const status: PaymentMethodStatusExtended = {
                    CountryCode: 'BR',
                    VendorStates: {} as any,
                };

                const user = {
                    Currency: 'USD',
                } as User;

                expect(
                    getAvailableCurrencies({
                        status,
                        user,
                        regionalCurrenciesEnabled: true,
                        paramCurrency: mainCurrencyParam,
                    })
                ).toEqual(['USD', 'EUR', 'CHF']);
            }
        );
    });

    describe('getSupportedRegionalCurrencies', () => {
        it('should return empty array if regional currencies are disabled', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    status,
                    user: {
                        Currency: 'USD' as any,
                    } as User,
                    subscription: {
                        Currency: 'USD',
                    } as Subscription,
                    regionalCurrenciesEnabled: false,
                })
            ).toEqual([]);
        });

        it('should return ergional currency if FF is disabled but user already has it', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    status,
                    user: {
                        Currency: 'BRL' as any,
                    } as User,
                    subscription: {
                        Currency: 'USD',
                    } as Subscription,
                    regionalCurrenciesEnabled: false,
                })
            ).toEqual(['BRL']);
        });

        it('should return ergional currency if FF is disabled but subscription already has it', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    status,
                    user: {
                        Currency: 'USD' as any,
                    } as User,
                    subscription: {
                        Currency: 'BRL',
                    } as Subscription,
                    regionalCurrenciesEnabled: false,
                })
            ).toEqual(['BRL']);
        });

        it('should return empty arre if user inhouse forced', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    status,
                    user: {
                        Currency: 'ARS' as any,
                        ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED,
                    } as User,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual([]);
        });

        it('should return regional currency if regional currencies are enabled', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'BR',
                VendorStates: {} as any,
            };

            expect(
                getSupportedRegionalCurrencies({
                    status,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['BRL']);
        });

        it('should return regional currency if regional currencies are enabled and user has it', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const user = {
                Currency: 'BRL',
            } as User;

            expect(
                getSupportedRegionalCurrencies({
                    status,
                    user,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['BRL']);
        });

        it('should return regional currency if regional currencies are enabled and subscription has it', () => {
            const status: PaymentMethodStatusExtended = {
                CountryCode: 'US',
                VendorStates: {} as any,
            };

            const subscription = {
                Currency: 'BRL',
            } as Subscription;

            expect(
                getSupportedRegionalCurrencies({
                    status,
                    subscription,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['BRL']);
        });

        it('should return regional currency if regional currencies are enabled and plans have it', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['BRL']);
        });

        it('should not return regional currency if plans have it but status does not', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual([]);
        });

        it('should not return regional currencies if status has it but plans do not', () => {
            const status: PaymentMethodStatusExtended = {
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
                    status,
                    plans,
                    regionalCurrenciesEnabled: true,
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
                    status,
                    user,
                    subscription,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(expected);
        });

        it('should not duplicated regional currencies', () => {
            const status = {
                CountryCode: 'AR',
                VendorStates: {} as any,
            };

            const plans = [
                {
                    Currency: 'BRL',
                },
                {
                    Currency: 'ARS',
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
                    status,
                    user,
                    subscription,
                    plans,
                    regionalCurrenciesEnabled: true,
                })
            ).toEqual(['ARS', 'BRL']);
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
