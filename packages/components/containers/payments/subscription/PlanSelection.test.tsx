import { renderHook } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { getDefaultMainCurrency } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { createMultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { getPlanByName } from '@proton/payments/core/subscription/plans-map-wrapper';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
    multiSubscriptionTestCatalog,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans, getTestPlans } from '@proton/payments/testing/data-plans';
import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { buildUser } from '@proton/shared/testing/buildUser';
import { useFlag } from '@proton/unleash/useFlag';

import { type AccessiblePlansHookProps, getMaximumCycle, useAccessiblePlans } from './PlanSelection';

vi.mock('@proton/app-context/useConfig', () => ({
    __esModule: true,
    useConfig: vi.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

const mockUseFlag = useFlag as unknown as MockedFunction<any>;

describe('useAccessiblePlans', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseFlag.mockReturnValue(false);
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
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
            isVpnSettingsApp: false,
        });
    });

    it('should render duo plan', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'DuoPlan') {
                return true;
            }
            return false;
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
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
            isVpnSettingsApp: false,
        });
    });

    it('should render new B2B plans when NewProtonBusinessBundlePlans flag is enabled', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'NewProtonBusinessBundlePlans') {
                return true;
            }
            return false;
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
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
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD', undefined, false),
                getPlanByName(plans, PLANS.BUNDLE_BIZ_2025, 'USD', undefined, false),
            ],
            isVpnSettingsApp: false,
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'BRL'),
                getPlanByName(plans, PLANS.VPN2024, 'BRL'),
                getPlanByName(plans, PLANS.DRIVE, 'BRL'),
                getPlanByName(plans, PLANS.PASS, 'BRL'),
                getPlanByName(plans, PLANS.LUMO, 'BRL'),
            ],
            IndividualPlans: [
                getPlanByName(plans, PLANS.MAIL, 'BRL'),
                getPlanByName(plans, PLANS.BUNDLE, 'BRL'),
                getPlanByName(plans, PLANS.DUO, 'BRL'),
            ],
            FamilyPlans: [getPlanByName(plans, PLANS.DUO, 'BRL'), getPlanByName(plans, PLANS.FAMILY, 'BRL')],
            B2BPlans: [
                getPlanByName(plans, PLANS.MAIL_PRO, 'USD'),
                getPlanByName(plans, PLANS.MAIL_BUSINESS, 'USD'),
                getPlanByName(plans, PLANS.BUNDLE_PRO_2024, 'USD'),
            ],
            isVpnSettingsApp: false,
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
                b2c: PLANS.VPN2024,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans,
            currency: 'USD',
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
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
                getPlanByName(plans, PLANS.VPN2024, 'USD', undefined, false),
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
            isVpnSettingsApp: false,
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({ Currency: 'CHF' }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
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
            isVpnSettingsApp: false,
        });
    });

    it('should render the BRL plan even when user is subscribed to its maximum cycle, because downcycling is allowed', () => {
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'BR',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'BRL',
            }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        expect(result.current).toMatchObject({
            enabledProductB2CPlans: [
                getPlanByName(plans, PLANS.MAIL, 'USD', undefined, false),
                // vpn2024 USD is now rendered: with downcycling allowed, lower cycles are eligible so /check succeeds.
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
            isVpnSettingsApp: false,
        });
    });

    it('should render the new bundle pro to a user who has the old one', () => {
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'USD',
            }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
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
            isVpnSettingsApp: false,
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'USD',
            }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
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
            isVpnSettingsApp: false,
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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser({
                Currency: 'USD',
            }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
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
            isVpnSettingsApp: false,
        });
    });

    it('should hide Pass Plus if user has Pass Lifetime', () => {
        mockUseFlag.mockImplementation((flag: string) => {
            if (flag === 'PassSimpleLoginLifetimeOffer') {
                return true;
            }
            return false;
        });

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
            app: APPS.PROTONMAIL,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user,
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
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
            app: APPS.PROTONPASS,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user,
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
        };

        const { result } = renderHook(() => useAccessiblePlans(props));

        const b2bPlans = result.current.B2BPlans;
        expect(b2bPlans).toHaveLength(0);
    });

    describe('isPassLifetimeEligible', () => {
        beforeEach(() => {
            mockUseFlag.mockImplementation((flag: string) => {
                if (flag === 'PassSimpleLoginLifetimeOffer') {
                    return true;
                }
                return false;
            });
        });

        const defaultProps: AccessiblePlansHookProps = {
            selectedProductPlans: {
                b2c: PLANS.MAIL,
                b2b: PLANS.MAIL_PRO,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans: getTestPlans('USD'),
            currency: 'USD',
            app: APPS.PROTONPASS,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser(),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
        };

        it('should be true when all conditions are met', () => {
            const { result } = renderHook(() => useAccessiblePlans(defaultProps));
            expect(result.current.isPassLifetimeEligible).toBe(true);
        });

        it('should be false if feature flag is disabled', () => {
            mockUseFlag.mockImplementation(() => false);

            const { result } = renderHook(() => useAccessiblePlans(defaultProps));
            expect(result.current.isPassLifetimeEligible).toBe(false);
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

        it('should be false when Pass Lifetime is not sold in the selected currency', () => {
            const plansWithoutLifetimeInJpy = getTestPlans('JPY').filter((plan) => plan.Name !== PLANS.PASS_LIFETIME);
            const props = {
                ...defaultProps,
                plans: [...getTestPlans('USD'), ...plansWithoutLifetimeInJpy],
                currency: 'JPY' as const,
                paymentStatus: { CountryCode: 'JP', VendorStates: {} as any },
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

    describe('currencies of each tab', () => {
        const mainCurrencyPlans = [...getTestPlans('USD'), ...getTestPlans('EUR'), ...getTestPlans('CHF')];

        const getTabCurrencies = (props: Partial<AccessiblePlansHookProps>) => {
            const { result } = renderHook(() =>
                useAccessiblePlans({
                    selectedProductPlans: { b2c: PLANS.MAIL, b2b: PLANS.MAIL_PRO, family: PLANS.FAMILY },
                    subscription: FREE_SUBSCRIPTION,
                    plans: mainCurrencyPlans,
                    currency: 'USD',
                    app: APPS.PROTONMAIL,
                    paymentStatus: { CountryCode: 'CH', VendorStates: {} as any },
                    user: buildUser({ Currency: 'USD' }),
                    audience: Audience.B2C,
                    multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(FREE_SUBSCRIPTION),
                    ...props,
                })
            );
            return result.current.availableCurrenciesByAudience;
        };

        it('offers a regional currency only in the tabs that have a card sold in it', () => {
            const duoAndFamilyInJpy = getTestPlans('JPY').filter(
                (plan) => plan.Name === PLANS.DUO || plan.Name === PLANS.FAMILY
            );

            expect(
                getTabCurrencies({
                    app: APPS.PROTONWALLET,
                    plans: [...mainCurrencyPlans, ...duoAndFamilyInJpy],
                    paymentStatus: { CountryCode: 'JP', VendorStates: {} as any },
                })
            ).toEqual({
                [Audience.B2C]: ['USD', 'EUR', 'CHF'],
                [Audience.FAMILY]: ['USD', 'EUR', 'CHF', 'JPY'],
                [Audience.B2B]: ['USD', 'EUR', 'CHF'],
            });
        });

        it('offers no currency to a tab whose cards are not sold in the locked currency or not offered next to two subscriptions', () => {
            const mailPlus = buildSubscription(PLANS.MAIL, { Currency: 'BRL' });
            const lumoPlus = buildSubscription(PLANS.LUMO, { Currency: 'BRL' });
            const b2cPlansInBrl = getTestPlans('BRL').filter((plan) =>
                [PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY].includes(plan.Name as PLANS)
            );

            expect(
                getTabCurrencies({
                    subscription: mailPlus,
                    plans: [...mainCurrencyPlans, ...b2cPlansInBrl],
                    currency: 'BRL',
                    paymentStatus: { CountryCode: 'BR', VendorStates: {} as any },
                    user: buildUser({ Currency: 'BRL' }),
                    multiSubscriptionContext: buildMultiSubscriptionContext([mailPlus, lumoPlus]),
                })
            ).toEqual({
                [Audience.B2C]: ['BRL'],
                [Audience.FAMILY]: [],
                [Audience.B2B]: [],
            });
        });

        it('offers only the currency of the web subscriptions, and no multi-user tab, when there are two of them', () => {
            const mailPlus = buildSubscription(PLANS.MAIL, { Currency: 'USD' });
            const lumoPlus = buildSubscription(PLANS.LUMO, { Currency: 'USD' });

            expect(
                getTabCurrencies({
                    subscription: mailPlus,
                    multiSubscriptionContext: buildMultiSubscriptionContext([mailPlus, lumoPlus]),
                })
            ).toEqual({
                [Audience.B2C]: ['USD'],
                [Audience.FAMILY]: [],
                [Audience.B2B]: [],
            });
        });
    });
});

describe('useAccessiblePlans in the Lumo app', () => {
    const withLumo2026Plans = (plans: Plan[]): Plan[] => {
        const lumoPlusPlans = plans.filter(({ Name }) => Name === PLANS.LUMO);
        return [
            ...plans,
            ...lumoPlusPlans.map((plan) => ({ ...plan, ID: `${plan.ID}-basic`, Name: PLANS.LUMO_BASIC })),
            ...lumoPlusPlans.map((plan) => ({ ...plan, ID: `${plan.ID}-ultra`, Name: PLANS.LUMO_ULTRA })),
        ];
    };

    const getProps = (overrides: Partial<AccessiblePlansHookProps> = {}): AccessiblePlansHookProps => {
        return {
            selectedProductPlans: {
                b2c: PLANS.LUMO,
                b2b: PLANS.LUMO_BUSINESS,
                family: PLANS.FAMILY,
            },
            subscription: FREE_SUBSCRIPTION,
            plans: withLumo2026Plans(getTestPlans('USD')),
            currency: 'USD',
            app: APPS.PROTONLUMO,
            paymentStatus: {
                CountryCode: 'CH',
                VendorStates: {} as any,
            },
            user: buildUser(),
            audience: Audience.B2C,
            ...overrides,
            multiSubscriptionContext: createMultiSubscriptionContext({
                lumoMultiSubscriptions: false,
                subscription: overrides.subscription ?? FREE_SUBSCRIPTION,
                entitlementCatalog: multiSubscriptionTestCatalog,
            }),
        };
    };

    const getPaidProps = (subscription: Subscription) => {
        return getProps({ subscription, user: buildUser({ Subscribed: 1 }) });
    };

    const getPlanNamesByTab = (props: AccessiblePlansHookProps) => {
        const { result } = renderHook(() => useAccessiblePlans(props));
        const toNames = (plans: { Name?: string; plan?: string }[]) => plans.map((plan) => plan.Name ?? plan.plan);

        return {
            individuals: toNames(result.current.IndividualPlans),
            family: toNames(result.current.FamilyPlans),
            business: toNames(result.current.B2BPlans),
        };
    };

    const setLumoPlans2026 = (enabled: boolean) => {
        mockUseFlag.mockImplementation((flag: string) => flag === 'LumoPlans2026' && enabled);
    };

    describe('LumoPlans2026 on', () => {
        beforeEach(() => {
            setLumoPlans2026(true);
        });

        const familyPlans = [PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY];
        const businessPlans = [PLANS.LUMO_BUSINESS, PLANS.BUNDLE_BIZ_2025];

        it('shows a free user Basic, Plus and Ultra, then Duo, Family and Visionary, then Lumo Professional and Workspace Premium', () => {
            expect(getPlanNamesByTab(getProps())).toEqual({
                individuals: [PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA],
                family: familyPlans,
                business: businessPlans,
            });
        });

        it('shows a Mail Plus subscriber the same tabs as a free user', () => {
            expect(getPlanNamesByTab(getPaidProps(buildSubscription(PLANS.MAIL)))).toEqual({
                individuals: [PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA],
                family: familyPlans,
                business: businessPlans,
            });
        });

        it('shows a Lumo Basic subscriber Plus and Ultra for individuals', () => {
            expect(getPlanNamesByTab(getPaidProps(buildLumoSubscription(PLANS.LUMO_BASIC)))).toEqual({
                individuals: [PLANS.LUMO, PLANS.LUMO_ULTRA],
                family: familyPlans,
                business: businessPlans,
            });
        });

        it.each([
            ['Lumo Plus', buildLumoSubscription(PLANS.LUMO)],
            ['Mail Plus with the Lumo addon', buildSubscription({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 })],
        ])('shows a %s subscriber only Ultra for individuals', (_, subscription) => {
            expect(getPlanNamesByTab(getPaidProps(subscription)).individuals).toEqual([PLANS.LUMO_ULTRA]);
        });

        it.each([
            ['Lumo Ultra', buildLumoSubscription(PLANS.LUMO_ULTRA)],
            ['Family', buildSubscription(PLANS.FAMILY)],
            ['Duo', buildSubscription(PLANS.DUO)],
            ['Visionary', buildSubscription(PLANS.VISIONARY)],
            ['Mail Professional', buildSubscription(PLANS.MAIL_PRO)],
        ])('hides the individuals tab from a %s subscriber', (_, subscription) => {
            expect(getPlanNamesByTab(getPaidProps(subscription)).individuals).toEqual([]);
        });

        it('does not change the plans of other apps', () => {
            const props = getProps({
                app: APPS.PROTONMAIL,
                selectedProductPlans: { b2c: PLANS.MAIL, b2b: PLANS.MAIL_PRO, family: PLANS.FAMILY },
            });
            const plansWithFlag = getPlanNamesByTab(props);
            setLumoPlans2026(false);

            expect(plansWithFlag).toEqual(getPlanNamesByTab(props));
        });
    });

    describe('LumoPlans2026 off', () => {
        beforeEach(() => {
            setLumoPlans2026(false);
        });

        it('keeps the current Lumo Plus card and lists', () => {
            expect(getPlanNamesByTab(getProps())).toEqual({
                individuals: [PLANS.LUMO, PLANS.BUNDLE, PLANS.DUO],
                family: [PLANS.DUO, PLANS.FAMILY],
                business: [PLANS.LUMO_BUSINESS],
            });
        });
    });
});

describe('getMaximumCycle', () => {
    it('should return yearly for b2b audience', () => {
        const maximumCycle = undefined;
        const audience = Audience.B2B;
        const app = APPS.PROTONMAIL;
        const currency = getDefaultMainCurrency();

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.YEARLY);
    });

    it('should return maximum cycle if it is low', () => {
        const maximumCycle = CYCLE.MONTHLY;
        const audience = Audience.B2B;
        const app = APPS.PROTONMAIL;
        const currency = getDefaultMainCurrency();

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.MONTHLY);
    });

    it('should return two year cycle if no special conditions are hit', () => {
        const maximumCycle = undefined;
        const audience = Audience.B2C;
        const app = APPS.PROTONMAIL;
        const currency = getDefaultMainCurrency();

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
        const currency = getDefaultMainCurrency();

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.YEARLY);
    });

    it('should return yearly for pass app', () => {
        const maximumCycle = undefined;
        const audience = Audience.B2C;
        const app = APPS.PROTONPASS;
        const currency = getDefaultMainCurrency();

        expect(getMaximumCycle(maximumCycle, audience, app, currency)).toBe(CYCLE.YEARLY);
    });

    describe('Lumo Plus card in the Lumo app', () => {
        const plans = getTestPlans('USD');
        const lumoPlus = getPlanByName(plans, PLANS.LUMO, 'USD', undefined, false);

        const getIndividualPlans = (subscription: Subscription, lumoMultiSubscriptions: boolean) => {
            const props: AccessiblePlansHookProps = {
                selectedProductPlans: { b2c: PLANS.LUMO, b2b: PLANS.MAIL_PRO, family: PLANS.FAMILY },
                subscription,
                plans,
                currency: 'USD',
                app: APPS.PROTONLUMO,
                paymentStatus: { CountryCode: 'CH', VendorStates: {} as any },
                user: buildUser({ Currency: 'USD' }),
                audience: Audience.B2C,
                multiSubscriptionContext: buildMultiSubscriptionContext([subscription], lumoMultiSubscriptions),
            };

            const { result } = renderHook(() => useAccessiblePlans(props));
            return result.current.IndividualPlans;
        };

        it('shows Lumo Plus to a Mail Plus subscriber with the flag on', () => {
            expect(getIndividualPlans(buildSubscription(PLANS.MAIL), true)).toContainEqual(lumoPlus);
        });

        it('hides Lumo Plus from a Mail Plus subscriber who has the Lumo addon, with the flag off and on', () => {
            const subscription = buildSubscription({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 });

            expect(getIndividualPlans(subscription, false)).not.toContainEqual(lumoPlus);
            expect(getIndividualPlans(subscription, true)).not.toContainEqual(lumoPlus);
        });

        it('hides Lumo Plus from a Family subscriber only with the flag on', () => {
            const subscription = buildSubscription(PLANS.FAMILY);

            expect(getIndividualPlans(subscription, false)).toContainEqual(lumoPlus);
            expect(getIndividualPlans(subscription, true)).not.toContainEqual(lumoPlus);
        });
    });
});

describe('useAccessiblePlans next to several subscriptions', () => {
    const plans = getLongTestPlans();
    const webMailPlus = buildSubscription(PLANS.MAIL);
    const webLumoPlus = buildLumoSubscription(PLANS.LUMO);

    const getPlanNames = (lumoMultiSubscriptions: boolean) => {
        mockUseFlag.mockImplementation((flag: string) => flag === 'DuoPlan');

        const props: AccessiblePlansHookProps = {
            selectedProductPlans: { b2c: PLANS.MAIL, b2b: PLANS.MAIL_PRO, family: PLANS.FAMILY },
            subscription: webMailPlus,
            plans,
            currency: 'USD',
            app: APPS.PROTONMAIL,
            paymentStatus: { CountryCode: 'CH', VendorStates: {} as any },
            user: buildUser({ Currency: 'USD' }),
            audience: Audience.B2C,
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus], lumoMultiSubscriptions),
        };

        const { result } = renderHook(() => useAccessiblePlans(props));
        const getNames = (accessiblePlans: Plan[]) => accessiblePlans.map((plan) => plan.Name);

        return {
            individual: getNames(result.current.IndividualPlans),
            family: getNames(result.current.FamilyPlans),
        };
    };

    it('offers no multi-user plan next to web Mail Plus and web Lumo Plus with the flag on', () => {
        const { individual, family } = getPlanNames(true);

        expect(individual).toEqual([PLANS.MAIL, PLANS.BUNDLE]);
        expect(family).toEqual([]);
    });

    it('keeps offering Duo and Family with the flag off', () => {
        const { individual, family } = getPlanNames(false);

        expect(individual).toEqual([PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO]);
        expect(family).toEqual([PLANS.DUO, PLANS.FAMILY]);
    });
});
