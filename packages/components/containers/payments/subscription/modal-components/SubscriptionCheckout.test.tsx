import type { ReactNode } from 'react';

import { screen } from '@testing-library/react';

import { CYCLE, FREE_PLAN, PLANS, SubscriptionMode } from '@proton/payments';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { type TaxCountryHook, useTaxCountry } from '@proton/payments/ui';
import { renderWithProviders } from '@proton/testing';
import { buildSubscription, buildUser } from '@proton/testing/builders';
import { getTestPlansMap } from '@proton/testing/data';

import SubscriptionCheckout, { type SubscriptionCheckoutProps } from './SubscriptionCheckout';

jest.mock('../../../../hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        APP_NAME: 'proton-account',
    }),
}));

jest.mock('../../Checkout', () => {
    const MockChildrenOnly = ({ children }: { children: ReactNode }) => <>{children}</>;
    return {
        __esModule: true,
        default: MockChildrenOnly,
    };
});

const WrappedSubscriptionCheckout = (props: Omit<SubscriptionCheckoutProps, 'taxCountry'>) => {
    const taxCountry = useTaxCountry({
        telemetryContext: 'other',
    });
    return <SubscriptionCheckout {...props} taxCountry={taxCountry} />;
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

    const dummyServers = { free: { servers: 0, countries: 0 }, paid: { servers: 0, countries: 0 } };

    it('should display Proration if it is available and isProration is true', () => {
        checkResult.Proration = -451;

        const { container } = renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Start date');
        expect(container).not.toHaveTextContent('Proration');
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
                vpnServers={{ free: { countries: 0, servers: 0 }, paid: { countries: 0, servers: 0 } }}
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
                paymentMethods={{} as any}
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
                vpnServers={{ free: { countries: 0, servers: 0 }, paid: { countries: 0, servers: 0 } }}
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
                paymentMethods={{} as any}
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
                vpnServers={{ free: { countries: 0, servers: 0 }, paid: { countries: 0, servers: 0 } }}
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
                paymentMethods={{} as any}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).toHaveTextContent('Credit');
        expect(container).not.toHaveTextContent('-CHF 107.73');
        expect(container).toHaveTextContent('CHF 107.73');
    });

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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(container).not.toHaveTextContent('Total for');
        expect(container).not.toHaveTextContent('Total for 12 months');
    });

    it('should display member price per month', () => {
        renderWithProviders(
            <WrappedSubscriptionCheckout
                freePlan={FREE_PLAN}
                checkResult={checkResult}
                plansMap={{} as any}
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
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
                vpnServers={dummyServers}
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
                paymentMethods={{} as any}
                paymentFacade={{ showTaxCountry: true } as any}
                trial={false}
            />
        );

        expect(screen.queryAllByTestId('members-price-per-month')).toHaveLength(0);
    });

    describe('billing address error banner', () => {
        const buildMockTaxCountry = (overrides?: Partial<TaxCountryHook>): TaxCountryHook => ({
            selectedCountryCode: 'US',
            setSelectedCountry: jest.fn(),
            federalStateCode: null,
            setFederalStateCode: jest.fn(),
            zipCode: null,
            setZipCode: jest.fn(),
            billingAddressValid: true,
            billingAddressStatus: { valid: true, reason: undefined },
            zipCodeBackendValid: true,
            paymentsApi: {} as any,
            billingAddressChangedInModal: jest.fn(),
            ...overrides,
        });

        const renderWithTaxCountry = (
            taxCountry: TaxCountryHook,
            paymentForbiddenReason: { forbidden: boolean; reason?: string } = { forbidden: false }
        ) =>
            renderWithProviders(
                <SubscriptionCheckout
                    freePlan={FREE_PLAN}
                    checkResult={getOptimisticCheckResult({
                        cycle: CYCLE.MONTHLY,
                        planIDs: { [PLANS.MAIL]: 1 },
                        plansMap: {} as any,
                        currency: 'CHF',
                    })}
                    plansMap={{} as any}
                    vpnServers={{ free: { servers: 0, countries: 0 }, paid: { servers: 0, countries: 0 } }}
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
                    paymentForbiddenReason={paymentForbiddenReason as any}
                    paymentMethods={{} as any}
                    paymentFacade={{ showTaxCountry: true } as any}
                    taxCountry={taxCountry}
                    trial={false}
                />
            );

        it('should display billing address error banner when there is an error message', () => {
            const taxCountry = buildMockTaxCountry({
                billingAddressErrorMessage: 'Please select billing country',
                billingAddressValid: false,
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
            });

            renderWithTaxCountry(taxCountry);

            expect(screen.getByText('Please select billing country')).toBeInTheDocument();
        });

        it('should not display billing address error banner when there is no error message', () => {
            const taxCountry = buildMockTaxCountry({
                billingAddressErrorMessage: undefined,
            });

            const { container } = renderWithTaxCountry(taxCountry);

            expect(container.querySelector('[class*="Banner"]')).not.toBeInTheDocument();
        });

        it('should not display billing address error banner when payment is forbidden', () => {
            const taxCountry = buildMockTaxCountry({
                billingAddressErrorMessage: 'Please select billing country',
                billingAddressValid: false,
                billingAddressStatus: { valid: false, reason: 'missingCountry' },
            });

            renderWithTaxCountry(taxCountry, { forbidden: true, reason: 'some reason' });

            expect(screen.queryByText('Please select billing country')).not.toBeInTheDocument();
        });

        it('should display zip code error message', () => {
            const taxCountry = buildMockTaxCountry({
                billingAddressErrorMessage: 'Please enter ZIP code',
                billingAddressValid: false,
                billingAddressStatus: { valid: false, reason: 'missingZipCode' },
            });

            renderWithTaxCountry(taxCountry);

            expect(screen.getByText('Please enter ZIP code')).toBeInTheDocument();
        });

        it('should display invalid zip code error message', () => {
            const taxCountry = buildMockTaxCountry({
                billingAddressErrorMessage: 'Please enter a valid ZIP code',
                billingAddressValid: false,
                billingAddressStatus: { valid: false, reason: 'invalidZipCode' },
            });

            renderWithTaxCountry(taxCountry);

            expect(screen.getByText('Please enter a valid ZIP code')).toBeInTheDocument();
        });
    });
});
