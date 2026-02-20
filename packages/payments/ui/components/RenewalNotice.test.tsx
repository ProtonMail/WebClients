import { render, screen } from '@testing-library/react';
import { addMonths } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getTermsURL } from '@proton/shared/lib/helpers/url';
import { buildSubscription } from '@proton/testing/builders';

import { type RequiredCheckResponse, getCheckoutUi } from '../../core/checkout';
import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '../../core/constants';
import type { PlanIDs } from '../../core/interface';
import type { PlansMap } from '../../core/plan/interface';
import { getPrice } from '../../core/price-helpers';
import { SubscriptionMode } from '../../core/subscription/constants';
import { getFreeCheckResult } from '../../core/subscription/freePlans';
import type { Subscription } from '../../core/subscription/interface';
import { getCheckoutRenewNoticeText, getCheckoutRenewNoticeTextFromCheckResult } from './RenewalNotice';

const RenewalNotice = (...props: Parameters<typeof getCheckoutRenewNoticeText>) => {
    return <div>{getCheckoutRenewNoticeText(...props)}</div>;
};

const RenewalNoticeFromCheck = (props: Parameters<typeof getCheckoutRenewNoticeTextFromCheckResult>[0]) => {
    return <div>{getCheckoutRenewNoticeTextFromCheckResult(props)}</div>;
};

const getDefaultPlansMap = (): PlansMap => {
    const plans = [
        {
            ID: 'KV8mjImpquR4tux9teokTx9bRB3GDgJYgDV2r1PCaCVD9o8InZs99CZr_q2G0qyP8QES4FZyxdO5gU1K-2Jv7Q==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'vpn2024',
            Title: 'VPN Plus',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 4,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 999,
                '3': 2397,
                '12': 7995,
                '15': 14985,
                '18': 8982,
                '24': 11976,
                '30': 29970,
            },
            DefaultPricing: {
                '1': 999,
                '3': 2397,
                '12': 7995,
                '15': 14985,
                '18': 8982,
                '24': 11976,
                '30': 29970,
            },
            PeriodEnd: {
                '1': 1719497218,
                '3': 1724767618,
                '12': 1748354818,
                '15': 1756303618,
                '18': 1764252418,
                '24': 1779890818,
                '30': 1795788418,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 12,
            Amount: 7995,
            Vendors: {
                Google: {
                    Plans: {},
                    CustomerID: 'cus_google_gOjTbjOE83fpVtO8A7ZY',
                },
                Apple: {
                    Plans: {},
                    CustomerID: '',
                },
            },
        },
        {
            ID: 'vXOiCO533JxXlqJsrhvREDwaFhGOXXV7NYjsz06VDJGSnes72blaG8hA9547xU1NLrMsDbA3lywhjPZ7oNYNcA==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'mail2022',
            Title: 'Mail Plus',
            MaxDomains: 1,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 16106127360,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 499,
                '12': 4788,
                '24': 8376,
            },
            DefaultPricing: {
                '1': 499,
                '12': 4788,
                '24': 8376,
            },
            PeriodEnd: {
                '1': 1719497218,
                '12': 1748354818,
                '24': 1779890818,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 1,
            Amount: 499,
            Vendors: {
                Google: {
                    Plans: {},
                    CustomerID: 'cus_google_gOjTbjOE83fpVtO8A7ZY',
                },
                Apple: {
                    Plans: {},
                    CustomerID: '',
                },
            },
        },
        {
            ID: 'yu50U8Rf9dhPHDcG3KTX6Nx3Euupk4uskAj9V9YVCFSB3oQk8_pTGfWwRFkRPYziGL5EsEx42ZyRHdcZxpO8CA==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'vpnpass2023',
            Title: 'VPN and Pass bundle',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 12,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 1099,
                '12': 9588,
                '15': 11985,
                '24': 14376,
                '30': 17970,
            },
            DefaultPricing: {
                '1': 1099,
                '12': 9588,
                '15': 11985,
                '24': 14376,
                '30': 17970,
            },
            PeriodEnd: {
                '1': 1719497218,
                '12': 1748354818,
                '15': 1756303618,
                '24': 1779890818,
                '30': 1795788418,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 12,
            Amount: 9588,
            Vendors: {
                Google: {
                    Plans: {},
                    CustomerID: 'cus_google_gOjTbjOE83fpVtO8A7ZY',
                },
                Apple: {
                    Plans: {},
                    CustomerID: '',
                },
            },
        },
    ];
    return toMap(plans, 'Name');
};

const defaultPlansMap = getDefaultPlansMap();

const getProps = (
    {
        plansMap = defaultPlansMap,
        planIDs = { [PLANS.MAIL]: 1 },
        checkResult,
    }: {
        planIDs?: PlanIDs;
        plansMap?: PlansMap;
        checkResult: RequiredCheckResponse;
    } = {
        checkResult: getFreeCheckResult(),
    }
): Pick<
    Parameters<typeof getCheckoutRenewNoticeText>[0],
    'planIDs' | 'checkout' | 'plansMap' | 'coupon' | 'currency' | 'app'
> => {
    const checkout = getCheckoutUi({ planIDs, plansMap, checkResult });
    return {
        planIDs,
        checkout,
        plansMap,
        coupon: checkResult?.Coupon || null,
        currency: 'CHF' as const,
        app: APPS.PROTONMAIL,
    };
};

describe('RenewalNotice', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        const mockedDate = new Date(2023, 10, 1);
        jest.setSystemTime(mockedDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Regular subscriptions', () => {
        it('should render', () => {
            const { container } = render(
                <RenewalNotice
                    cycle={12}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={false}
                    subscription={undefined}
                    {...getProps()}
                />
            );
            expect(container).not.toBeEmptyDOMElement();
        });

        it('should display the correct renewal date', () => {
            const renewCycle = 12;
            const expectedDateString = 'November 1st, 2024';

            const { container } = render(
                <RenewalNotice
                    cycle={renewCycle}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={false}
                    subscription={undefined}
                    {...getProps()}
                />
            );
            expect(container).toHaveTextContent(
                `Subscription auto-renews every 12 months. Your next billing date is ${expectedDateString}. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should use period end date if custom billing is enabled', () => {
            const renewCycle = 12;
            const expectedDateString = 'August 11th, 2025';

            const { container } = render(
                <RenewalNotice
                    cycle={renewCycle}
                    isCustomBilling={true}
                    isScheduledChargedImmediately={false}
                    subscription={
                        {
                            // the backend returns seconds, not milliseconds
                            PeriodEnd: +new Date(2025, 7, 11) / 1000,
                        } as any
                    }
                    {...getProps()}
                />
            );
            expect(container).toHaveTextContent(
                `Subscription auto-renews every 12 months. Your next billing date is ${expectedDateString}. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should use the end of upcoming subscription period if scheduled subscription is enabled', () => {
            const renewCycle = 24; // the upcoming subscription takes another 24 months
            const { container } = render(
                <RenewalNotice
                    cycle={renewCycle}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={true}
                    subscription={
                        {
                            // the backend returns seconds, not milliseconds
                            PeriodEnd: +new Date(2024, 1, 3) / 1000, // the current subscription period ends on 02/03/2024 (3rd of February 2024)
                        } as any
                    }
                    {...getProps()}
                />
            );

            const expectedDateString = 'February 3rd, 2026'; // and finally the renewal date is 02/03/2026 (3rd of February 2026)

            expect(container).toHaveTextContent(
                `Subscription auto-renews every 24 months. Your next billing date is ${expectedDateString}. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should use the end of current subscription period if "ScheduledChargedLater" is enabled', () => {
            // while addon downgrading also schedules subscription, it doesn't charge user immediately.
            // User will be charged when the scheduled subscription starts.
            // That's significant difference from scheduled subscription that charges user immediately.

            const subscription: Subscription = buildSubscription(
                {
                    [PLANS.BUNDLE_PRO_2024]: 1,
                    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 10,
                },
                {
                    PeriodStart: 1718200044,
                    PeriodEnd: 1749736044,
                    CreateTime: 1718200044,
                }
            );

            const { container } = render(
                <RenewalNotice
                    {...getProps()}
                    cycle={CYCLE.YEARLY}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={false}
                    isScheduledChargedLater={true}
                    isProration={false}
                    planIDs={{ bundlepro2024: 1, '1domain-bundlepro2024': 5, '1member-bundlepro2024': 5 }}
                    subscription={subscription}
                />
            );

            // end of the current subscription, NOT upcoming that will be created when user accepts the terms of ScheduledChargedLater subscription
            const expectedDateString = 'June 12th, 2025';

            expect(container).toHaveTextContent(
                `Your scheduled plan starts on ${expectedDateString} and will auto-renew every 12 months. Your next billing date is ${expectedDateString}. You can cancel at any time. Please contact support if you require an immediate plan change. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should render scheduled later monthly wording with T&C (full string)', () => {
            const expectedDateString = 'January 5th, 2024';
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 0, 5) / 1000,
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps()}
                    cycle={CYCLE.MONTHLY}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={false}
                    isScheduledChargedLater={true}
                    subscription={subscription}
                />
            );

            expect(container).toHaveTextContent(
                `Your scheduled plan starts on ${expectedDateString} and will auto-renew every month. Your next billing date is ${expectedDateString}. You can cancel at any time. Please contact support if you require an immediate plan change. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should display tax-exclusive pricing in regular renewal notice', () => {
            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        checkResult: {
                            Amount: 499,
                            AmountDue: 499,
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: CYCLE.MONTHLY,
                            TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
                        },
                    })}
                    cycle={CYCLE.MONTHLY}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={false}
                    subscription={undefined}
                />
            );

            expect(container).toHaveTextContent(
                `Subscription auto-renews every month. Your next billing date is December 1st, 2023. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should display tax-exclusive pricing with renewal override', () => {
            const cycle = CYCLE.YEARLY;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            AmountDue: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: cycle,
                            TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: getPrice({ [PLANS.VPN2024]: 1 }, CYCLE.YEARLY, defaultPlansMap),
                            RenewCycle: CYCLE.YEARLY,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `Your subscription will automatically renew on November 1st, 2024. You'll then be billed every 12 months at CHF 79.95 (excl. tax). You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });
    });

    describe('VPN2024 renewal overrides', () => {
        it('should display special renewal notice for vpn2024 - 24 months', () => {
            const cycle = CYCLE.TWO_YEARS;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            AmountDue: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: cycle,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: getPrice({ [PLANS.VPN2024]: 1 }, CYCLE.YEARLY, defaultPlansMap),
                            RenewCycle: CYCLE.YEARLY,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `Your subscription will automatically renew on November 1st, 2025. You'll then be billed every 12 months at CHF 79.95. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should display special renewal notice for vpn2024 - 12 months', () => {
            const cycle = CYCLE.YEARLY;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            AmountDue: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: cycle,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: getPrice({ [PLANS.VPN2024]: 1 }, CYCLE.YEARLY, defaultPlansMap),
                            RenewCycle: CYCLE.YEARLY,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `Your subscription will automatically renew on November 1st, 2024. You'll then be billed every 12 months at CHF 79.95. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should display special renewal notice for vpn2024 - 15 months', () => {
            const cycle = CYCLE.FIFTEEN;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            AmountDue: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: cycle,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: getPrice({ [PLANS.VPN2024]: 1 }, CYCLE.YEARLY, defaultPlansMap),
                            RenewCycle: CYCLE.YEARLY,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `Your subscription will automatically renew on February 1st, 2025. You'll then be billed every 12 months at CHF 79.95. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should display special renewal notice for vpn2024 - 30 months', () => {
            const cycle = CYCLE.THIRTY;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            AmountDue: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: cycle,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: getPrice({ [PLANS.VPN2024]: 1 }, CYCLE.YEARLY, defaultPlansMap),
                            RenewCycle: CYCLE.YEARLY,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `Your subscription will automatically renew on May 1st, 2026. You'll then be billed every 12 months at CHF 79.95. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it(`should display special renewal notice for vpn2024 ${CYCLE.MONTHLY} months`, () => {
            const { container } = render(
                <RenewalNotice
                    {...getProps({ planIDs: { [PLANS.VPN2024]: 1 }, checkResult: getFreeCheckResult() })}
                    cycle={CYCLE.MONTHLY}
                />
            );

            expect(container).toHaveTextContent(
                `Subscription auto-renews every month. Your next billing date is December 1st, 2023. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it(`should display special renewal notice for vpn2024 ${CYCLE.THREE} months`, () => {
            const { container } = render(
                <RenewalNotice
                    {...getProps({ planIDs: { [PLANS.VPN2024]: 1 }, checkResult: getFreeCheckResult() })}
                    cycle={CYCLE.THREE}
                />
            );

            expect(container).toHaveTextContent(
                `Subscription auto-renews every 3 months. Your next billing date is February 1st, 2024. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should display special renewal notice for vpn2024 with tax-exclusive pricing - 24 months', () => {
            const cycle = CYCLE.TWO_YEARS;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            AmountDue: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: cycle,
                            TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: getPrice({ [PLANS.VPN2024]: 1 }, CYCLE.YEARLY, defaultPlansMap),
                            RenewCycle: CYCLE.YEARLY,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `Your subscription will automatically renew on November 1st, 2025. You'll then be billed every 12 months at CHF 79.95 (excl. tax). You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });

        it('should display special renewal notice for vpn2024 with tax-exclusive pricing - 12 months', () => {
            const cycle = CYCLE.YEARLY;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            AmountDue: getPrice({ [PLANS.VPN2024]: 1 }, cycle, defaultPlansMap),
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: cycle,
                            TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: getPrice({ [PLANS.VPN2024]: 1 }, CYCLE.YEARLY, defaultPlansMap),
                            RenewCycle: CYCLE.YEARLY,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `Your subscription will automatically renew on November 1st, 2024. You'll then be billed every 12 months at CHF 79.95 (excl. tax). You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        });
    });
});

describe('Trials (from check result)', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2023, 10, 1));
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it('should render trial monthly notice with T&C (full string)', () => {
        const { container } = render(
            <RenewalNoticeFromCheck
                checkResult={{
                    Amount: 0,
                    AmountDue: 0,
                    Proration: 0,
                    CouponDiscount: 0,
                    Gift: 0,
                    Credit: 0,
                    Coupon: null,
                    Cycle: CYCLE.MONTHLY,
                    TaxInclusive: 1,
                    Taxes: [],
                    Currency: 'CHF',
                    SubscriptionMode: SubscriptionMode.Trial,
                    BaseRenewAmount: null,
                    RenewCycle: CYCLE.MONTHLY,
                    PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
                }}
                plansMap={getDefaultPlansMap()}
                planIDs={{ [PLANS.MAIL]: 1 }}
                app={APPS.PROTONMAIL}
            />
        );
        expect(container).toHaveTextContent(
            'After the trial ends on Nov 15, 2023, it will become a paid subscription that auto-renews monthly. You won’t be charged if you cancel before Nov 15, 2023. Renewal pricing subject to change according to terms and conditions.'
        );
    });

    it('should render trial non-monthly notice with T&C (full string)', () => {
        const { container } = render(
            <RenewalNoticeFromCheck
                checkResult={{
                    Amount: 0,
                    AmountDue: 0,
                    Proration: 0,
                    CouponDiscount: 0,
                    Gift: 0,
                    Credit: 0,
                    Coupon: null,
                    Cycle: CYCLE.THREE,
                    TaxInclusive: 1,
                    Taxes: [],
                    Currency: 'CHF',
                    SubscriptionMode: SubscriptionMode.Trial,
                    BaseRenewAmount: null,
                    RenewCycle: CYCLE.THREE,
                    PeriodEnd: +addMonths(new Date(), CYCLE.THREE) / 1000,
                }}
                plansMap={getDefaultPlansMap()}
                planIDs={{ [PLANS.MAIL]: 1 }}
                app={APPS.PROTONMAIL}
            />
        );
        expect(container).toHaveTextContent(
            'After the trial ends on Nov 15, 2023, it will become a paid subscription that auto-renews every 3 months. You won’t be charged if you cancel before Nov 15, 2023. Renewal pricing subject to change according to terms and conditions.'
        );
    });
});

describe('Coupons - multiple redemptions', () => {
    it('should render monthly multiple-redemptions coupon notice (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.MAIL]: 1 },
                    checkResult: {
                        Amount: 499,
                        AmountDue: 100,
                        Proration: 0,
                        CouponDiscount: -399,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'MULTI-RED-2',
                            Description: 'multi redemption',
                            MaximumRedemptionsPerUser: 2,
                        },
                        Cycle: CYCLE.MONTHLY,
                        TaxInclusive: 1,
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
                    },
                })}
                cycle={CYCLE.MONTHLY}
            />
        );

        expect(container).toHaveTextContent(
            'The specially discounted price of CHF 1 is valid for 2 months. Then it will automatically be renewed at CHF 4.99 for 1 month. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
        );
    });

    it('should render non-monthly multiple-redemptions coupon notice (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.MAIL]: 1 },
                    checkResult: {
                        Amount: 4788,
                        AmountDue: 4788,
                        Proration: 0,
                        CouponDiscount: 0,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'MULTI-RED-3',
                            Description: 'multi redemption',
                            MaximumRedemptionsPerUser: 3,
                        },
                        Cycle: CYCLE.YEARLY,
                        TaxInclusive: 1,
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.YEARLY) / 1000,
                    },
                })}
                cycle={CYCLE.YEARLY}
            />
        );

        expect(container).toHaveTextContent(
            'The specially discounted price of CHF 47.88 is valid for the first 12 months. The discount is valid for 2 renewals. Then it will automatically be renewed at CHF 47.88 for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
        );
    });

    it('should render monthly multiple-redemptions coupon notice with tax-exclusive pricing (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.MAIL]: 1 },
                    checkResult: {
                        Amount: 499,
                        AmountDue: 100,
                        Proration: 0,
                        CouponDiscount: -399,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'MULTI-RED-2',
                            Description: 'multi redemption',
                            MaximumRedemptionsPerUser: 2,
                        },
                        Cycle: CYCLE.MONTHLY,
                        TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
                    },
                })}
                cycle={CYCLE.MONTHLY}
            />
        );

        expect(container).toHaveTextContent(
            'The specially discounted price of CHF 1 (excl. tax) is valid for 2 months. Then it will automatically be renewed at CHF 4.99 (excl. tax) for 1 month. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
        );
    });

    it('should render non-monthly multiple-redemptions coupon notice with tax-exclusive pricing (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.MAIL]: 1 },
                    checkResult: {
                        Amount: 4788,
                        AmountDue: 4788,
                        Proration: 0,
                        CouponDiscount: 0,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'MULTI-RED-3',
                            Description: 'multi redemption',
                            MaximumRedemptionsPerUser: 3,
                        },
                        Cycle: CYCLE.YEARLY,
                        TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.YEARLY) / 1000,
                    },
                })}
                cycle={CYCLE.YEARLY}
            />
        );

        expect(container).toHaveTextContent(
            'The specially discounted price of CHF 47.88 (excl. tax) is valid for the first 12 months. The discount is valid for 2 renewals. Then it will automatically be renewed at CHF 47.88 (excl. tax) for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
        );
    });
});

describe('Coupons - one-time (standard notice)', () => {
    it.each([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.FIFTEEN, CYCLE.THIRTY])(
        'should render one-time coupon for vpn2024 (%i months) (+ T&C)',
        (cycle) => {
            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.VPN2024]: 1 },
                        checkResult: {
                            Amount: 11976,
                            AmountDue: 10776,
                            Proration: 0,
                            CouponDiscount: -1200,
                            Gift: 0,
                            Credit: 0,
                            Coupon: {
                                Code: 'VPNINTROPRICE2024',
                                Description: 'Introductory price for VPN Plus',
                                MaximumRedemptionsPerUser: 1,
                            },
                            Cycle: 24,
                            TaxInclusive: 1,
                            Taxes: [
                                {
                                    Name: 'Mehrwertsteuer (MWST)',
                                    Rate: 8.0999999999999996,
                                    Amount: 807,
                                },
                            ],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.Regular,
                            BaseRenewAmount: 7995,
                            RenewCycle: 12,
                            PeriodEnd: +addMonths(new Date(), cycle) / 1000,
                        },
                    })}
                    cycle={cycle}
                />
            );

            expect(container).toHaveTextContent(
                `The specially discounted price of CHF 107.76 is valid for the first ${cycle} months. Then it will automatically be renewed at CHF 79.95 for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
            );
        }
    );

    it('should render one-time coupon for 12m vpnpass bundle (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.VPN_PASS_BUNDLE]: 1 },
                    checkResult: {
                        Amount: 10395,
                        AmountDue: 4788,
                        Proration: 0,
                        CouponDiscount: -5607,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'TECHRADARVPNPASS',
                            Description: '',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: CYCLE.YEARLY,
                        TaxInclusive: 1,
                        Taxes: [
                            {
                                Name: 'Mehrwertsteuer (MWST)',
                                Rate: 8.0999999999999996,
                                Amount: 359,
                            },
                        ],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.YEARLY) / 1000,
                    },
                })}
                cycle={CYCLE.YEARLY}
            />
        );

        expect(container).toHaveTextContent(
            'The specially discounted price of CHF 47.88 is valid for the first 12 months. Then it will automatically be renewed at CHF 95.88 for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
        );
    });

    it('should render one-time coupon for Mail monthly (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.MAIL]: 1 },
                    checkResult: {
                        Amount: 499,
                        AmountDue: 100,
                        Proration: 0,
                        CouponDiscount: -399,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'MAILPLUSINTRO',
                            Description: 'MAILPLUSINTRO',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: 1,
                        TaxInclusive: 1,
                        Taxes: [
                            {
                                Name: 'Mehrwertsteuer (MWST)',
                                Rate: 8.0999999999999996,
                                Amount: 7,
                            },
                        ],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
                    },
                })}
                cycle={CYCLE.MONTHLY}
            />
        );
        expect(container).toHaveTextContent(
            'The specially discounted price of CHF 1 is valid for the first month. Then it will automatically be renewed at CHF 4.99 every month. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
        );
    });

    it('should render one-time coupon for Mail monthly with tax-exclusive pricing (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.MAIL]: 1 },
                    checkResult: {
                        Amount: 499,
                        AmountDue: 100,
                        Proration: 0,
                        CouponDiscount: -399,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'MAILPLUSINTRO',
                            Description: 'MAILPLUSINTRO',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: 1,
                        TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
                    },
                })}
                cycle={CYCLE.MONTHLY}
            />
        );
        expect(container).toHaveTextContent(
            'The specially discounted price of CHF 1 (excl. tax) is valid for the first month. Then it will automatically be renewed at CHF 4.99 (excl. tax) every month. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
        );
    });

    it('should render one-time coupon for vpn2024 12m with tax-exclusive pricing (+ T&C)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.VPN2024]: 1 },
                    checkResult: {
                        Amount: 7995,
                        AmountDue: 7995,
                        Proration: 0,
                        CouponDiscount: 0,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'VPNINTROPRICE2024',
                            Description: 'Introductory price for VPN Plus',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: 12,
                        TaxInclusive: 0, // TaxExclusive.EXCLUSIVE
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: 7995,
                        RenewCycle: 12,
                        PeriodEnd: +addMonths(new Date(), 12) / 1000,
                    },
                })}
                cycle={CYCLE.YEARLY}
            />
        );

        expect(container).toHaveTextContent(
            `The specially discounted price of CHF 79.95 (excl. tax) is valid for the first 12 months. Then it will automatically be renewed at CHF 79.95 (excl. tax) for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.`
        );
    });
});
describe('Coupons - one-time (short notice)', () => {
    it('should render short coupon notice without T&C (full string)', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps({
                    planIDs: { [PLANS.MAIL]: 1 },
                    checkResult: {
                        Amount: 499,
                        AmountDue: 100,
                        Proration: 0,
                        CouponDiscount: -399,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'SHORT-ONE',
                            Description: 'short one time',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: CYCLE.MONTHLY,
                        TaxInclusive: 1,
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.Regular,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +addMonths(new Date(), CYCLE.MONTHLY) / 1000,
                    },
                })}
                cycle={CYCLE.MONTHLY}
                short
            />
        );

        expect(container).toHaveTextContent('Renews at CHF 4.99, cancel anytime.');
        expect(container).not.toHaveTextContent('terms and conditions');
    });
});

describe('terms and Conditions link', () => {
    it('should render T&C link with correct href', () => {
        render(
            <RenewalNotice
                {...getProps()}
                cycle={CYCLE.YEARLY}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                subscription={undefined}
            />
        );
        const link = screen.getByRole('link', { name: /terms and conditions/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', getTermsURL(APPS.PROTONMAIL));
    });
});

describe('Custom Billing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2023, 10, 1));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Regular renewal notice', () => {
        it('should use subscription period end date for custom billing', () => {
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 5, 15) / 1000, // June 15, 2024
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        checkResult: {
                            Amount: 499,
                            AmountDue: 499,
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: CYCLE.MONTHLY,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.CustomBillings,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +new Date(2024, 5, 15) / 1000,
                        },
                    })}
                    cycle={CYCLE.MONTHLY}
                    isCustomBilling={true}
                    subscription={subscription}
                />
            );

            expect(container).toHaveTextContent(
                'Subscription auto-renews every month. Your next billing date is June 15th, 2024. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });

        it('should use subscription period end date for custom billing with yearly cycle', () => {
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 11, 31) / 1000, // December 31, 2024
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        checkResult: {
                            Amount: 4788,
                            AmountDue: 4788,
                            Proration: 0,
                            CouponDiscount: 0,
                            Gift: 0,
                            Credit: 0,
                            Coupon: null,
                            Cycle: CYCLE.YEARLY,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.CustomBillings,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +new Date(2024, 11, 31) / 1000,
                        },
                    })}
                    cycle={CYCLE.YEARLY}
                    isCustomBilling={true}
                    subscription={subscription}
                />
            );

            expect(container).toHaveTextContent(
                'Subscription auto-renews every 12 months. Your next billing date is December 31st, 2024. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });
    });

    describe('With coupons - one-time redemption', () => {
        it('should render custom billing coupon notice for monthly cycle without showing discounted price', () => {
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 2, 15) / 1000, // March 15, 2024
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.MAIL]: 1 },
                        checkResult: {
                            Amount: 499,
                            AmountDue: 100,
                            Proration: 0,
                            CouponDiscount: -399,
                            Gift: 0,
                            Credit: 0,
                            Coupon: {
                                Code: 'CUSTOM-BILLING-COUPON',
                                Description: 'Custom billing coupon',
                                MaximumRedemptionsPerUser: 1,
                            },
                            Cycle: CYCLE.MONTHLY,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.CustomBillings,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +new Date(2024, 2, 15) / 1000,
                        },
                    })}
                    cycle={CYCLE.MONTHLY}
                    isCustomBilling={true}
                    subscription={subscription}
                />
            );

            expect(container).toHaveTextContent(
                'The specially discounted price is valid for the first month. Then it will automatically be renewed at CHF 4.99 every month. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });

        it('should render custom billing coupon notice for yearly cycle without showing discounted price', () => {
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 8, 30) / 1000, // September 30, 2024
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.MAIL]: 1 },
                        checkResult: {
                            Amount: 4788,
                            AmountDue: 2000,
                            Proration: 0,
                            CouponDiscount: -2788,
                            Gift: 0,
                            Credit: 0,
                            Coupon: {
                                Code: 'YEARLY-CUSTOM-BILLING',
                                Description: 'Yearly custom billing coupon',
                                MaximumRedemptionsPerUser: 1,
                            },
                            Cycle: CYCLE.YEARLY,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.CustomBillings,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +new Date(2024, 8, 30) / 1000,
                        },
                    })}
                    cycle={CYCLE.YEARLY}
                    isCustomBilling={true}
                    subscription={subscription}
                />
            );

            expect(container).toHaveTextContent(
                'The specially discounted price is valid for the first 12 months. Then it will automatically be renewed at CHF 47.88 for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });

        it('should render short custom billing coupon notice without terms and conditions', () => {
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 1, 28) / 1000, // February 28, 2024
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.MAIL]: 1 },
                        checkResult: {
                            Amount: 499,
                            AmountDue: 250,
                            Proration: 0,
                            CouponDiscount: -249,
                            Gift: 0,
                            Credit: 0,
                            Coupon: {
                                Code: 'SHORT-CUSTOM-BILLING',
                                Description: 'Short custom billing coupon',
                                MaximumRedemptionsPerUser: 1,
                            },
                            Cycle: CYCLE.MONTHLY,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.CustomBillings,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +new Date(2024, 1, 28) / 1000,
                        },
                    })}
                    cycle={CYCLE.MONTHLY}
                    isCustomBilling={true}
                    subscription={subscription}
                    short
                />
            );

            expect(container).toHaveTextContent('Renews at CHF 4.99, cancel anytime.');
            expect(container).not.toHaveTextContent('terms and conditions');
        });
    });

    describe('With coupons - multiple redemptions', () => {
        it('should render custom billing multiple redemptions coupon notice for monthly cycle', () => {
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 3, 10) / 1000, // April 10, 2024
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.MAIL]: 1 },
                        checkResult: {
                            Amount: 499,
                            AmountDue: 100,
                            Proration: 0,
                            CouponDiscount: -399,
                            Gift: 0,
                            Credit: 0,
                            Coupon: {
                                Code: 'MULTI-CUSTOM-BILLING',
                                Description: 'Multi redemption custom billing',
                                MaximumRedemptionsPerUser: 3,
                            },
                            Cycle: CYCLE.MONTHLY,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.CustomBillings,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +new Date(2024, 3, 10) / 1000,
                        },
                    })}
                    cycle={CYCLE.MONTHLY}
                    isCustomBilling={true}
                    subscription={subscription}
                />
            );

            expect(container).toHaveTextContent(
                'The specially discounted price is valid for 3 months. Then it will automatically be renewed at CHF 4.99 for 1 month. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });

        it('should render custom billing multiple redemptions coupon notice for yearly cycle', () => {
            const subscription: Subscription = {
                PeriodEnd: +new Date(2024, 6, 20) / 1000, // July 20, 2024
            } as any;

            const { container } = render(
                <RenewalNotice
                    {...getProps({
                        planIDs: { [PLANS.MAIL]: 1 },
                        checkResult: {
                            Amount: 4788,
                            AmountDue: 2000,
                            Proration: 0,
                            CouponDiscount: -2788,
                            Gift: 0,
                            Credit: 0,
                            Coupon: {
                                Code: 'MULTI-YEARLY-CUSTOM',
                                Description: 'Multi yearly custom billing',
                                MaximumRedemptionsPerUser: 2,
                            },
                            Cycle: CYCLE.YEARLY,
                            TaxInclusive: 1,
                            Taxes: [],
                            Currency: 'CHF',
                            SubscriptionMode: SubscriptionMode.CustomBillings,
                            BaseRenewAmount: null,
                            RenewCycle: null,
                            PeriodEnd: +new Date(2024, 6, 20) / 1000,
                        },
                    })}
                    cycle={CYCLE.YEARLY}
                    isCustomBilling={true}
                    subscription={subscription}
                />
            );

            expect(container).toHaveTextContent(
                'The specially discounted price is valid for the first 12 months. The discount is valid for 1 renewal. Then it will automatically be renewed at CHF 47.88 for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });
    });

    describe('From check result', () => {
        it('should render custom billing notice from check result', () => {
            const { container } = render(
                <RenewalNoticeFromCheck
                    checkResult={{
                        Amount: 499,
                        AmountDue: 499,
                        Proration: 0,
                        CouponDiscount: 0,
                        Gift: 0,
                        Credit: 0,
                        Coupon: null,
                        Cycle: CYCLE.MONTHLY,
                        TaxInclusive: 1,
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.CustomBillings,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +new Date(2024, 4, 25) / 1000, // May 25, 2024
                    }}
                    plansMap={getDefaultPlansMap()}
                    planIDs={{ [PLANS.MAIL]: 1 }}
                    subscription={
                        {
                            PeriodEnd: +new Date(2024, 4, 25) / 1000,
                        } as any
                    }
                    app={APPS.PROTONMAIL}
                />
            );

            expect(container).toHaveTextContent(
                'Subscription auto-renews every month. Your next billing date is May 25th, 2024. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });

        it('should render custom billing notice with coupon from check result', () => {
            const { container } = render(
                <RenewalNoticeFromCheck
                    checkResult={{
                        Amount: 4788,
                        AmountDue: 2000,
                        Proration: 0,
                        CouponDiscount: -2788,
                        Gift: 0,
                        Credit: 0,
                        Coupon: {
                            Code: 'CUSTOM-CHECK-RESULT',
                            Description: 'Custom billing from check result',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: CYCLE.YEARLY,
                        TaxInclusive: 1,
                        Taxes: [],
                        Currency: 'CHF',
                        SubscriptionMode: SubscriptionMode.CustomBillings,
                        BaseRenewAmount: null,
                        RenewCycle: null,
                        PeriodEnd: +new Date(2024, 9, 15) / 1000, // October 15, 2024
                    }}
                    plansMap={getDefaultPlansMap()}
                    planIDs={{ [PLANS.MAIL]: 1 }}
                    subscription={
                        {
                            PeriodEnd: +new Date(2024, 9, 15) / 1000,
                        } as any
                    }
                    app={APPS.PROTONMAIL}
                />
            );

            expect(container).toHaveTextContent(
                'The specially discounted price is valid for the first 12 months. Then it will automatically be renewed at CHF 47.88 for 12 months. You can cancel at any time. Renewal pricing subject to change according to terms and conditions.'
            );
        });
    });
});

describe('getPassLifetimeRenewNoticeText', () => {
    it('should show basic lifetime message when no subscription exists', () => {
        const { container } = render(
            <RenewalNotice
                {...getProps()}
                cycle={CYCLE.YEARLY}
                subscription={undefined}
                planIDs={{ [PLANS.PASS_LIFETIME]: 1 }}
            />
        );

        expect(container).toHaveTextContent(
            "Pass lifetime deal has no renewal price, it's a one-time payment for lifetime access to Pass."
        );
    });

    it('should show basic lifetime message for free plan', () => {
        const subscription = {
            Plans: [
                {
                    Name: PLANS.FREE,
                },
            ],
        } as Subscription;

        const { container } = render(
            <RenewalNotice
                {...getProps()}
                cycle={CYCLE.YEARLY}
                subscription={subscription}
                planIDs={{ [PLANS.PASS_LIFETIME]: 1 }}
            />
        );

        expect(container).toHaveTextContent(
            "Pass lifetime deal has no renewal price, it's a one-time payment for lifetime access to Pass."
        );
    });

    it('should show replacement message for Pass Plus subscribers', () => {
        const subscription = {
            Plans: [
                {
                    Type: PLAN_TYPES.PLAN,
                    Name: PLANS.PASS,
                },
            ],
        } as Subscription;

        const { container } = render(
            <RenewalNotice
                {...getProps()}
                cycle={CYCLE.YEARLY}
                subscription={subscription}
                planIDs={{ [PLANS.PASS_LIFETIME]: 1 }}
            />
        );

        expect(container).toHaveTextContent(
            "Your Pass Plus subscription will be replaced with Pass Lifetime. The remaining balance of your subscription will be added to your account. Pass lifetime deal has no renewal price, it's a one-time payment for lifetime access to Pass."
        );
    });

    it('should show unchanged subscription message for other plan subscribers', () => {
        const subscription = {
            Plans: [
                {
                    Type: PLAN_TYPES.PLAN,
                    Name: PLANS.MAIL,
                    Title: 'Mail Plus',
                },
            ],
        } as Subscription;

        const { container } = render(
            <RenewalNotice
                {...getProps()}
                cycle={CYCLE.YEARLY}
                subscription={subscription}
                planIDs={{ [PLANS.PASS_LIFETIME]: 1 }}
            />
        );

        expect(container).toHaveTextContent(
            "Pass lifetime deal has no renewal price, it's a one-time payment for lifetime access to Pass. Your Mail Plus subscription renewal price and date remain unchanged. Renewal pricing subject to change according to terms and conditions."
        );
    });
});
