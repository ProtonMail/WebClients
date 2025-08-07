import { renderHook } from '@testing-library/react';

import {
    CYCLE,
    type Currency,
    DEFAULT_CURRENCY,
    FREE_SUBSCRIPTION,
    PLANS,
    type Subscription,
    getPlanByName,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import { buildSubscription, buildUser } from '@proton/testing/builders';
import { getLongTestPlans, getTestPlans } from '@proton/testing/data';
import { useFlag } from '@proton/unleash';

import { type AccessiblePlansHookProps, getMaximumCycle, useAccessiblePlans } from './PlanSelection';

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

const mockUseFlag = useFlag as unknown as jest.MockedFunction<any>;

describe('useAccessiblePlans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the plans accessible to free users in mail app', () => {
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
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should render duo plan', () => {
        mockUseFlag.mockImplementation((flag: string) => {
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
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should render BRL plans if country code is BR', () => {
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
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [getPlanByName(plans, PLANS.VPN2024, 'BRL', undefined, false)],
            IndividualPlans: [getPlanByName(plans, PLANS.VPN2024, 'BRL', undefined, false)],
            FamilyPlans: [],
            B2BPlans: [],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should render BRL currency option when USD plans are rendered and country code is BR', () => {
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
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should not render BRL plans if country code is not BR', () => {
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
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should not render BRL plans if user is subscribed to the maximum cycle of the only BRL plan', () => {
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
                Plans: [getPlanByName(plans, PLANS.VPN2024, 'BRL')],
            } as any,
            plans,
            currency: 'USD',
            planIDs: {},
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'BRL',
            }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                // vpn2024 USD should not be rendered either because all /check calls are forbidden in this case.
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: true,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should render old bundle pro if user already has it', () => {
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
                Plans: [getPlanByName(plans, PLANS.BUNDLE_PRO, 'USD')],
            } as any,
            plans,
            currency: 'USD',
            planIDs: {
                [PLANS.BUNDLE_PRO]: 1,
            },
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'USD',
            }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should render new bundle pro if user already has it', () => {
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
                Plans: [getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD')],
            } as any,
            plans,
            currency: 'USD',
            planIDs: {
                [PLANS.BUNDLE_PRO_2024]: 1,
            },
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'USD',
            }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should render new bundle pro plan for free users', () => {
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
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'USD',
            }),
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DRIVE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.PASS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE, 'USD', undefined, false),
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
            ],
            FamilyPlans: [
                getPlanByName(plans, PLANS.DUO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.FAMILY, 'USD', undefined, false),
            ],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD', undefined, false),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
            ],
            alreadyHasMaxCycle: false,
            isVpnSettingsApp: false,
            isVpnB2bPlans: false,
        });
    });

    it('should hide Pass Plus if user has Pass Lifetime', () => {
        const plans = [...getTestPlans('USD'), ...getTestPlans('CHF'), ...getTestPlans('EUR')];

        const user = buildUser({
            hasPassLifetime: true,
        });
        user.Flags['pass-lifetime'] = true;

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
            app: APPS.PROTONMAIL,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user,
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        const passPlus = result.current.enabledProductB2CPlans.find((plan) => plan.Name === PLANS.PASS);
        expect(passPlus).toBeUndefined();
    });

    it('should hide B2B plans for lifetime users when they open the pass dashboard', () => {
        const plans = [...getTestPlans('USD'), ...getTestPlans('CHF'), ...getTestPlans('EUR')];

        const user = buildUser({
            hasPassLifetime: true,
        });
        user.Flags['pass-lifetime'] = true;

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
            app: APPS.PROTONPASS,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user,
            audience: Audience.B2C,
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        const b2bPlans = result.current.B2BPlans;
        expect(b2bPlans).toHaveLength(0);
    });

    describe('isPassLifetimeEligible', () => {
        const defaultProps: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans: getTestPlans('USD'),
            currency: 'USD',
            planIDs: {},
            app: APPS.PROTONPASS,
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
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser(),
            audience: Audience.B2C,
        };

        it('should be true when all conditions are met', () => {
            const { result } = renderHook(() => useAccessiblePlans(defaultProps));
            expect(result.current.isPassLifetimeEligible).toBe(true);
        });

        it('should be false when not in Pass Settings app', () => {
            const props = {
                ...defaultProps,
                app: APPS.PROTONMAIL,
            };
            const { result } = renderHook(() => useAccessiblePlans(props));
            expect(result.current.isPassLifetimeEligible).toBe(false);
        });

        it('should be false when user has Pass Lifetime', () => {
            const props = {
                ...defaultProps,
                user: buildUser({ hasPassLifetime: true }),
            };
            const { result } = renderHook(() => useAccessiblePlans(props));
            expect(result.current.isPassLifetimeEligible).toBe(false);
        });

        it('should be false when not in B2C audience', () => {
            const props = {
                ...defaultProps,
                audience: Audience.B2B,
            };
            const { result } = renderHook(() => useAccessiblePlans(props));
            expect(result.current.isPassLifetimeEligible).toBe(false);
        });

        it('should be false when Pass Lifetime plan is not available', () => {
            const plansWithoutLifetime = getTestPlans('USD').filter((plan) => plan.Name !== PLANS.PASS_LIFETIME);
            const props = {
                ...defaultProps,
                plans: plansWithoutLifetime,
            };
            const { result } = renderHook(() => useAccessiblePlans(props));
            expect(result.current.isPassLifetimeEligible).toBe(false);
        });

        it('should be false when current plan is Pass Family', () => {
            const subscription: Subscription = buildSubscription({
                [PLANS.PASS_FAMILY]: 1,
            });
            const props = {
                ...defaultProps,
                subscription,
            };
            const { result } = renderHook(() => useAccessiblePlans(props));
            expect(result.current.isPassLifetimeEligible).toBe(false);
        });

        it('should be false when current plan is a B2B plan', () => {
            const subscription: Subscription = buildSubscription({
                [PLANS.MAIL_BUSINESS]: 1,
            });
            const props = {
                ...defaultProps,
                subscription,
            };
            const { result } = renderHook(() => useAccessiblePlans(props));
            expect(result.current.isPassLifetimeEligible).toBe(false);
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
