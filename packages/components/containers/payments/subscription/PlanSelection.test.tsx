import { renderHook } from '@testing-library/react';

import { getPlan } from '@proton/payments';
import { ADDON_NAMES, APPS, CYCLE, DEFAULT_CURRENCY, FREE_SUBSCRIPTION, PLANS } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';
import { Audience, type Plan, type User } from '@proton/shared/lib/interfaces';
import { PLANS_MAP, getLongTestPlans, getTestPlans } from '@proton/testing/data';
import { useFlag } from '@proton/unleash';

import { type AccessiblePlansHookProps, getMaximumCycle, getPrice, useAccessiblePlans } from './PlanSelection';

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

describe('getPrice', () => {
    it('should return null if the current plan does not have pricing for the selected cycle', () => {
        const plan = PLANS_MAP[PLANS.VPN_PRO] as Plan;
        expect(getPrice(plan, CYCLE.THIRTY, PLANS_MAP)).toBeNull();
    });

    it('should return cycle price for the current plan', () => {
        const plan = PLANS_MAP[PLANS.FAMILY] as Plan;
        expect(getPrice(plan, CYCLE.TWO_YEARS, PLANS_MAP)).toBe(plan.Pricing[CYCLE.TWO_YEARS]);
    });

    it.each([
        [PLANS.VPN_PRO, ADDON_NAMES.MEMBER_VPN_PRO],
        [PLANS.VPN_BUSINESS, ADDON_NAMES.MEMBER_VPN_BUSINESS],
        [PLANS.PASS_PRO, ADDON_NAMES.MEMBER_PASS_PRO],
        [PLANS.PASS_BUSINESS, ADDON_NAMES.MEMBER_PASS_BUSINESS],
    ])('should return member addon cycle price for the selected plans: %s', (planName, addonName) => {
        const plan = PLANS_MAP[planName] as Plan;
        const addon = PLANS_MAP[addonName] as Plan;

        expect(getPrice(plan, CYCLE.TWO_YEARS, PLANS_MAP)).toBe(addon.Pricing[CYCLE.TWO_YEARS]);
    });

    it('should return the plan pricing if the addon is not available', () => {
        const plan = PLANS_MAP[PLANS.VPN_PRO] as Plan;

        const plansMap = {
            ...PLANS_MAP,
            [ADDON_NAMES.MEMBER_VPN_PRO]: undefined,
        };

        expect(getPrice(plan, CYCLE.TWO_YEARS, plansMap)).toBe(plan.Pricing[CYCLE.TWO_YEARS]);
    });
});

const mockUseFlag = useFlag as unknown as jest.MockedFunction<any>;

describe('useAccessiblePlans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the plans accessible to free users in mail app', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }
        });

        const plans = getLongTestPlans();

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans,
            currency: 'USD',
            planIDs: {},
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'CHF',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should render duo plan', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }

            if (flag === 'DuoPlan') {
                return true;
            }
        });

        const plans = getLongTestPlans();

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans,
            currency: 'USD',
            planIDs: {},
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'CHF',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should render BRL plans if country code is BR', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }

            if (
                flag === 'VpnSignupRegionalCurrency' ||
                flag === 'V2SignupRegionalCurrency' ||
                flag === 'DashboardRegionalCurrency'
            ) {
                return true;
            }
        });

        const plans = [
            ...getTestPlans('USD'),
            ...getTestPlans('CHF'),
            ...getTestPlans('EUR'),
            ...getTestPlans('BRL').filter((it) => it.Name === PLANS.VPN2024),
        ];

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans,
            currency: 'BRL',
            planIDs: {},
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'CHF',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [getPlan(plans, PLANS.VPN2024, 'BRL', undefined, false)],
            IndividualPlans: [getPlan(plans, PLANS.VPN2024, 'BRL', undefined, false)],
            FamilyPlans: [],
            B2BPlans: [],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should render BRL currency option when USD plans are rendered and country code is BR', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }

            if (
                flag === 'VpnSignupRegionalCurrency' ||
                flag === 'V2SignupRegionalCurrency' ||
                flag === 'DashboardRegionalCurrency'
            ) {
                return true;
            }
        });

        const plans = [
            ...getTestPlans('USD'),
            ...getTestPlans('CHF'),
            ...getTestPlans('EUR'),
            ...getTestPlans('BRL').filter((it) => it.Name === PLANS.VPN2024),
        ];

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.VPN,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans,
            currency: 'USD',
            planIDs: {},
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'CHF',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should not render BRL plans if country code is not BR', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }
        });

        const plans = [
            ...getTestPlans('USD'),
            ...getTestPlans('CHF'),
            ...getTestPlans('EUR'),
            ...getTestPlans('BRL').filter((it) => it.Name === PLANS.VPN2024),
        ];

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans,
            currency: 'USD',
            planIDs: {},
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'CHF',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should not render BRL plans if user is subscribed to the maximum cycle of the only BRL plan', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }
        });

        const plans = [
            ...getTestPlans('USD'),
            ...getTestPlans('CHF'),
            ...getTestPlans('EUR'),
            ...getTestPlans('BRL').filter((it) => it.Name === PLANS.VPN2024),
        ];

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: {
                Currency: 'BRL',
                Cycle: CYCLE.TWO_YEARS,
                Plans: [getPlan(plans, PLANS.VPN2024, 'BRL')],
            } as any,
            plans,
            currency: 'USD',
            planIDs: {},
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'BRL',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: true,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should render old bundle pro if user already has it', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }
        });

        const plans = [...getTestPlans('USD'), ...getTestPlans('CHF'), ...getTestPlans('EUR')];

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: {
                Currency: 'USD',
                Cycle: CYCLE.MONTHLY,
                Plans: [getPlan(plans, PLANS.BUNDLE_PRO, 'USD')],
            } as any,
            plans,
            currency: 'USD',
            planIDs: {
                [PLANS.BUNDLE_PRO]: 1,
            },
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'USD',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should render new bundle pro if user already has it', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }
        });

        const plans = [...getTestPlans('USD'), ...getTestPlans('CHF'), ...getTestPlans('EUR')];

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: {
                Currency: 'USD',
                Cycle: CYCLE.MONTHLY,
                Plans: [getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD')],
            } as any,
            plans,
            currency: 'USD',
            planIDs: {
                [PLANS.BUNDLE_PRO_2024]: 1,
            },
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'USD',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });

    it('should render new bundle pro plan for free users', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'WalletPlan') {
                return false;
            }
        });

        const plans = [...getTestPlans('USD'), ...getTestPlans('CHF'), ...getTestPlans('EUR')];

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans,
            currency: 'USD',
            planIDs: {},
            app: 'proton-mail',
            vpnServers: {
                free: {
                    servers: 9,
                    countries: 4,
                },
                paid: {
                    servers: 400,
                    countries: 50,
                },
            },
            paymentsStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: {
                Currency: 'USD',
            } as User,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlan(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlan(plans, PLANS.PASS, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlan(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlan(plans, PLANS.DUO, 'USD', undefined, false),
                getPlan(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlan(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlan(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlan(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
            canAccessWalletPlan: false,
        });
    });
});

describe('getMaximumCycle', () => {
    it('should return yearly for b2b audience', () => {
        const maximumCycle = undefined;
        const audience = Audience.B2B;
        const app = APPS.PROTONMAIL;
        const currency = DEFAULT_CURRENCY;

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.YEARLY);
    });

    it('should return maximum cycle if it is low', () => {
        const maximumCycle = CYCLE.MONTHLY;
        const audience = Audience.B2B;
        const app = APPS.PROTONMAIL;
        const currency = DEFAULT_CURRENCY;

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.MONTHLY);
    });

    it('should return two year cycle if no special conditions are hit', () => {
        const maximumCycle = undefined;
        const audience = Audience.B2C;
        const app = APPS.PROTONMAIL;
        const currency = DEFAULT_CURRENCY;

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.TWO_YEARS);
    });

    it.each(['BRL', 'JPY'] as Currency[])('should return yearly for regional currencies - %s', (currency) => {
        const maximumCycle = undefined;
        const audience = Audience.B2C;
        const app = APPS.PROTONMAIL;

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.YEARLY);
    });

    it('should return yearly for wallet app', () => {
        const maximumCycle = undefined;
        const audience = Audience.B2C;
        const app = APPS.PROTONWALLET;
        const currency = DEFAULT_CURRENCY;

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.YEARLY);
    });

    it('should return yearly for pass app', () => {
        const maximumCycle = undefined;
        const audience = Audience.B2C;
        const app = APPS.PROTONPASS;
        const currency = DEFAULT_CURRENCY;

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.YEARLY);
    });
});
