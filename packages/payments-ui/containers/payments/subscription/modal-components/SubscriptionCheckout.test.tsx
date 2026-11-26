import type { ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { getReadableTime } from '@proton/components/components/time/Time';
import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { ADDON_NAMES, CYCLE, PAYMENT_METHOD_TYPES, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import { SubscriptionMode, TaxMode } from '@proton/shared/lib/payments/subscription/constants';
import type { FullPlansMap } from '@proton/shared/lib/payments/subscription/interface';
import { buildUser } from '@proton/shared/testing/buildUser';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import type * as UseFlagModule from '@proton/unleash/useFlag';

import { getIdealAuthorizationText } from '../../../../payment-methods/ideal/IdealAuthorizationText';
import { useTaxCountry } from '../../../../ui/billing-address/hooks/useTaxCountry';
import SubscriptionCheckout, { type SubscriptionCheckoutProps } from './SubscriptionCheckout';

vi.mock('@proton/app-context/useConfig', () => ({
    __esModule: true,
    useConfig: vi.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

const mockScribeToLumo = vi.fn(() => false);
vi.mock('@proton/unleash/useFlag', async (importOriginal) => {
    const actual = await importOriginal<typeof UseFlagModule>();
    return {
        ...actual,
        useFlag: (flag: Parameters<typeof actual.useFlag>[0]) =>
            flag === MailFeatureFlag.ScribeToLumo ? mockScribeToLumo() : actual.useFlag(flag),
    };
});

vi.mock('@proton/components/containers/payments/Checkout', () => {
    const MockCheckout = ({
        children,
        renewNotice,
        showPaymentProtectionCopy,
        description,
    }: {
        children: ReactNode;
        renewNotice: ReactNode;
        showPaymentProtectionCopy: boolean;
        description: ReactNode;
    }) => (
        <>
            {children}
            <div data-testid="renew-notice">{renewNotice}</div>
            {showPaymentProtectionCopy && <div data-testid="payment-protection-copy" />}
            {description}
        </>
    );
    return {
        __esModule: true,
        default: MockCheckout,
    };
});

const WrappedSubscriptionCheckout = ({
    multiSubscriptionContext,
    ...props
}: Omit<SubscriptionCheckoutProps, 'taxCountry' | 'multiSubscriptionContext'> & {
    multiSubscriptionContext?: MultiSubscriptionContext;
}) => {
    const taxCountry = useTaxCountry({
        telemetryContext: 'other',
    });
    return (
        <SubscriptionCheckout
            {...props}
            taxCountry={taxCountry}
            multiSubscriptionContext={
                multiSubscriptionContext ?? buildMultiSubscriptionContextFromSubscription(props.subscription)
            }
        />
    );
};

describe('SubscriptionCheckout', () => {
    let checkResult: SubscriptionEstimation;

    beforeEach(() => {
        checkResult = {
            Amount: 499,
            AmountDue: 499,
            Coupon: null,
            Currency: 'CHF',
            Cycle: CYCLE.MONTHLY,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            requestData: {
                Plans: { [PLANS.MAIL]: 1 },
                Currency: 'CHF',
                Cycle: CYCLE.MONTHLY,
            },
        };
    });

    it('should display Proration if it is available and isProration is true', () => {
        checkResult.Proration = -451;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={true}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('-CHF 4.51');
    });

    it('should display Proration if it is available and isProration is true', () => {
        checkResult.Proration = -451;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={true}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('-CHF 4.51');
    });

    it('should not display proration if isProration is false', () => {
        checkResult.Proration = -451;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={getOptimisticCheckResult({
                    cycle: CYCLE.MONTHLY,
                    planIDs: { [PLANS.MAIL]: 1 },
                    plansMap: getTestPlansMap('CHF'),
                    currency: 'CHF',
                })}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).not.toHaveTextContent('Proration');
        expect(container).not.toHaveTextContent('-CHF 4.51');
    });

    it('should display next start date if proration must be hidden', () => {
        const checkResult = getOptimisticCheckResult({
            cycle: CYCLE.YEARLY,
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap: getTestPlansMap('CHF'),
            currency: 'CHF',
        });

        checkResult.Proration = 0;
        checkResult.SubscriptionMode = SubscriptionMode.ScheduledChargedImmediately;
        checkResult.optimistic = false;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{}}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={true}
                isScheduledChargedLater={false}
                isScheduled={true}
                subscription={buildSubscription(
                    {
                        cycle: CYCLE.MONTHLY,
                        planName: PLANS.MAIL,
                        currency: 'CHF',
                    },
                    {
                        PeriodEnd: 1668868986,
                    }
                )}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Start date');
        expect(container).not.toHaveTextContent('Proration');
    });

    it('shows the start date of the subscription the purchase changes, not of the loaded one', () => {
        const mailPlusPeriodEnd = 1825000000;
        const lumoPlusPeriodEnd = 1796000000;
        const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { Cycle: CYCLE.MONTHLY, PeriodEnd: lumoPlusPeriodEnd });
        const webMailPlus = buildSubscription(
            { cycle: CYCLE.YEARLY, planName: PLANS.MAIL, currency: 'CHF' },
            { PeriodEnd: mailPlusPeriodEnd }
        );
        const checkResult = getOptimisticCheckResult({
            cycle: CYCLE.YEARLY,
            planIDs: { [PLANS.LUMO]: 1 },
            plansMap: getTestPlansMap('CHF'),
            currency: 'CHF',
        });
        checkResult.Proration = 0;
        checkResult.SubscriptionMode = SubscriptionMode.ScheduledChargedImmediately;
        checkResult.optimistic = false;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.LUMO]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={true}
                isScheduledChargedLater={false}
                isScheduled={true}
                subscription={{ ...webMailPlus, SecondarySubscriptions: [webLumoPlus] }}
                multiSubscriptionContext={buildMultiSubscriptionContext([webMailPlus, webLumoPlus])}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent(getReadableTime({ value: lumoPlusPeriodEnd }));
        expect(container).not.toHaveTextContent(getReadableTime({ value: mailPlusPeriodEnd }));
    });

    it('keeps the current term end of the changed subscription when it already has an upcoming term', () => {
        const mailPlusPeriodEnd = 1825000000;
        const lumoPlusPeriodEnd = 1796000000;
        const lumoPlusUpcomingPeriodEnd = 1827536000;
        const webLumoPlus = {
            ...buildLumoSubscription(PLANS.LUMO, { Cycle: CYCLE.MONTHLY, PeriodEnd: lumoPlusPeriodEnd }),
            UpcomingSubscription: buildLumoSubscription(PLANS.LUMO, {
                Cycle: CYCLE.YEARLY,
                PeriodStart: lumoPlusPeriodEnd,
                PeriodEnd: lumoPlusUpcomingPeriodEnd,
                IsPrepaid: true,
            }),
        };
        const webMailPlus = buildSubscription(
            { cycle: CYCLE.YEARLY, planName: PLANS.MAIL, currency: 'CHF' },
            { PeriodEnd: mailPlusPeriodEnd }
        );
        const checkResult = getOptimisticCheckResult({
            cycle: CYCLE.YEARLY,
            planIDs: { [PLANS.LUMO_ULTRA]: 1 },
            plansMap: getTestPlansMap('CHF'),
            currency: 'CHF',
        });
        checkResult.Proration = 0;
        checkResult.SubscriptionMode = SubscriptionMode.ScheduledChargedImmediately;
        checkResult.optimistic = false;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.LUMO_ULTRA]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={true}
                isScheduledChargedLater={false}
                isScheduled={true}
                subscription={{ ...webMailPlus, SecondarySubscriptions: [webLumoPlus] }}
                multiSubscriptionContext={buildMultiSubscriptionContext([webMailPlus, webLumoPlus])}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent(getReadableTime({ value: lumoPlusPeriodEnd }));
        expect(container).not.toHaveTextContent(getReadableTime({ value: lumoPlusUpcomingPeriodEnd }));
        expect(container).not.toHaveTextContent(getReadableTime({ value: mailPlusPeriodEnd }));
    });

    it('should display positive proration', () => {
        checkResult = {
            ...checkResult,
            AmountDue: 4085,
            Proration: 127583,
            Amount: 199750,
            Cycle: 1,
            CouponDiscount: 0,
            Gift: 0,
            Currency: 'CHF',
            UnusedCredit: 0,
            Credit: -323248,
            Coupon: null,
        };

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={true}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription(undefined, {
                    PeriodEnd: 1668868986,
                })}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Proration');
        expect(container).toHaveTextContent('CHF 1275.83');
        expect(container).not.toHaveTextContent('-CHF 1275.83');
    });

    /**
     * An example when credits are negative:
     * - you have 10 credits on the account
     * - you upgrade to a 5$/month plan
     * - you should see credits -5 in the <WrappedSubscriptionCheckout>
     */
    it('should display negative credits value', () => {
        checkResult = {
            ...checkResult,
            AmountDue: 0,
            Proration: -19149,
            Amount: 8376,
            Cycle: 24,
            CouponDiscount: 0,
            Gift: 0,
            Currency: 'CHF',
            UnusedCredit: 0,
            Credit: -10773,
            Coupon: null,
        };

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription(undefined, {
                    PeriodEnd: 1668868986,
                })}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Credit');
        expect(container).toHaveTextContent('-CHF 107.73');
    });

    /**
     * Example when credits are positive:
     * - you have 0 credits
     * - you have a plan that's 10/mo
     * - move to a plan that's 5/mo
     * - you should see credits 5 (these will end up on your account balance)
     */
    it('should display positive credits value', () => {
        checkResult = {
            ...checkResult,
            AmountDue: 0,
            Proration: -19149,
            Amount: 8376,
            Cycle: 24,
            CouponDiscount: 0,
            Gift: 0,
            Currency: 'CHF',
            UnusedCredit: 0,
            Credit: 10773,
            Coupon: null,
        };

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{}}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription(undefined, {
                    PeriodEnd: 1668868986,
                })}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Credit');
        expect(container).not.toHaveTextContent('-CHF 107.73');
        expect(container).toHaveTextContent('CHF 107.73');
    });

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 1000, { forbidden: false }, true],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 0, { forbidden: false }, false],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 1000, { forbidden: false }, false],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 1000, { forbidden: true, reason: 'already-subscribed' }, false],
    ] as const)(
        'renders the iDEAL authorization note for %s with amount %s and %o: %s',
        (selectedMethodValue, amount, paymentForbiddenReason, shown) => {
            renderWithProviders(
                <WrappedSubscriptionCheckout
                    freePlan={FREE_PLAN}
                    checkResult={getOptimisticCheckResult({
                        cycle: CYCLE.YEARLY,
                        planIDs: { [PLANS.MAIL]: 1 },
                        plansMap: {} as any,
                        currency: 'EUR',
                    })}
                    plansMap={{} as any}
                    currency="EUR"
                    cycle={CYCLE.YEARLY}
                    planIDs={{ [PLANS.MAIL]: 1 }}
                    user={buildUser()}
                    onChangeCurrency={() => {}}
                    isProration={false}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={false}
                    isScheduledChargedLater={false}
                    isScheduled={false}
                    subscription={buildSubscription()}
                    paymentForbiddenReason={paymentForbiddenReason}
                    paymentFacade={{ showTaxCountry: true, selectedMethodValue, amount } as any}
                    trial={false}
                    submit={<button type="submit">Pay</button>}
                />
            );

            expect(!!screen.queryByText(getIdealAuthorizationText())).toBe(shown);
        }
    );

    it('should display correct billing cycle text for yearly subscription', () => {
        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={getOptimisticCheckResult({
                    cycle: CYCLE.YEARLY,
                    planIDs: { [PLANS.MAIL]: 1 },
                    plansMap: {} as any,
                    currency: 'CHF',
                })}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.MAIL]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(screen.getByTestId('billed-cycle-text')).toBeInTheDocument();
        expect(container).toHaveTextContent('1 year');
    });

    it('should display billed cycle text for lifetime plans', () => {
        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={getOptimisticCheckResult({
                    cycle: CYCLE.YEARLY,
                    planIDs: { [PLANS.PASS_LIFETIME]: 1 },
                    plansMap: {} as any,
                    currency: 'CHF',
                })}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.PASS_LIFETIME]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(screen.getByTestId('billed-cycle-text')).toBeInTheDocument();
        expect(container).toHaveTextContent('Lifetime access');
    });

    it('should display price row', () => {
        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={getOptimisticCheckResult({
                    cycle: CYCLE.YEARLY,
                    planIDs: { [PLANS.MAIL]: 1 },
                    plansMap: {} as any,
                    currency: 'CHF',
                })}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.MAIL]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Total for');
        expect(container).toHaveTextContent('Total for 12 months');
    });

    it('should not display price row for lifetime plans', () => {
        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.PASS_LIFETIME]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).not.toHaveTextContent('Total for');
        expect(container).not.toHaveTextContent('Total for 12 months');
    });

    it('should name held writing-assistant seats after Lumo with ScribeToLumo on', () => {
        mockScribeToLumo.mockReturnValue(true);
        onTestFinished(() => {
            mockScribeToLumo.mockReset();
        });
        const planIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2 };
        const plansMap = getTestPlansMap('CHF') as FullPlansMap;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={getOptimisticCheckResult({ cycle: CYCLE.MONTHLY, planIDs, plansMap, currency: 'CHF' })}
                plansMap={plansMap}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={planIDs}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('2 Lumo writing assistant seats');
    });

    it('should display member price per month', () => {
        renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.MAIL]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(screen.getByTestId('members-price-per-month')).toBeInTheDocument();
        expect(screen.getByTestId('members-price-per-month')).toHaveTextContent('4.99');
    });

    it('should not display member price per month for lifetime plans', () => {
        renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.YEARLY}
                planIDs={{ [PLANS.PASS_LIFETIME]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(screen.queryAllByTestId('members-price-per-month')).toHaveLength(0);
    });

    it.each([
        { plan: PLANS.PASS, rowCount: 1 },
        { plan: PLANS.PASS_BASIC, rowCount: 0 },
    ])('should render $rowCount price, tax-exclusive, proration and credits row for $plan', ({ plan, rowCount }) => {
        renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={{
                    ...checkResult,
                    TaxMode: TaxMode.EXCLUSIVE,
                    Taxes: [{ Name: 'VAT', Rate: 20, Amount: 100 }],
                    Proration: -451,
                    Credit: -200,
                }}
                plansMap={{} as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{ [plan]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={true}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(screen.queryAllByTestId('price')).toHaveLength(rowCount);
        expect(screen.queryAllByTestId('container-undefined')).toHaveLength(rowCount);
        expect(screen.queryAllByTestId('proration-value')).toHaveLength(rowCount);
        expect(screen.queryAllByTestId('credits-value')).toHaveLength(rowCount);
    });

    it.each([
        { plan: PLANS.PASS, isPassBasic: false },
        { plan: PLANS.PASS_BASIC, isPassBasic: true },
    ])(
        'should show the switch terms notice instead of payment protection copy for $plan: $isPassBasic',
        ({ plan, isPassBasic }) => {
            renderWithProviders(
                <WrappedSubscriptionCheckout
                    freePlan={FREE_PLAN}
                    checkResult={{ ...checkResult, AmountDue: 0 }}
                    plansMap={{} as any}
                    currency="CHF"
                    cycle={CYCLE.MONTHLY}
                    planIDs={{ [plan]: 1 }}
                    user={buildUser()}
                    onChangeCurrency={() => {}}
                    isProration={false}
                    isCustomBilling={false}
                    isScheduledChargedImmediately={false}
                    isScheduledChargedLater={false}
                    isScheduled={false}
                    subscription={buildSubscription()}
                    paymentForbiddenReason={{ forbidden: false }}
                    paymentFacade={{ showTaxCountry: true } as any}
                    trial={false}
                />
            );

            expect(screen.queryAllByTestId('payment-protection-copy')).toHaveLength(isPassBasic ? 0 : 1);
            expect(
                screen.getByTestId('renew-notice').textContent ===
                    'By switching, you agree to our terms and conditions.'
            ).toBe(isPassBasic);
        }
    );

    it('shows the offer price inline with a discount badge, like a hidden coupon', () => {
        checkResult = {
            ...checkResult,
            OfferName: 'demo',
            OfferDescription: 'Demo offer',
            OfferDiscount: [{ Name: PLANS.MAIL, Amount: -200 }],
            AmountDue: 299,
        };

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={getTestPlansMap('CHF') as any}
                currency="CHF"
                cycle={CYCLE.MONTHLY}
                planIDs={{ [PLANS.MAIL]: 1 }}
                user={buildUser()}
                onChangeCurrency={() => {}}
                isProration={false}
                isCustomBilling={false}
                isScheduledChargedImmediately={false}
                isScheduledChargedLater={false}
                isScheduled={false}
                subscription={buildSubscription()}
                paymentForbiddenReason={{ forbidden: false }}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(screen.getByTestId('price')).toHaveTextContent('2.99');
        expect(screen.getByTestId('members-price-per-month')).toHaveTextContent('2.99');
        expect(container).toHaveTextContent('-40%');
        expect(container).not.toHaveTextContent('Demo offer');
        expect(screen.queryByTestId('coupon-discount')).not.toBeInTheDocument();
    });
});
