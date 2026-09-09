import { useEffect, useRef } from 'react';

import { render, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import { telemetry } from '@proton/shared/lib/telemetry';
import { getStoreWrapper } from '@proton/testing/lib/context/renderWithProviders';

import { type PaymentsContextType, PaymentsContextProvider, usePayments } from './PaymentContext';

const checkSubscription = jest.fn();

jest.mock('@proton/components/payments/react-extensions/usePaymentsApi', () => {
    const paymentsApi = {
        checkSubscription: (...args: any[]) => checkSubscription(...args),
        cacheMultiCheck: jest.fn(),
        multiCheck: jest.fn().mockResolvedValue([]),
        getFullBillingAddress: jest.fn().mockResolvedValue({}),
    } as unknown as PaymentsApi;

    return {
        usePaymentsApi: () => ({ paymentsApi, getPaymentsApi: () => paymentsApi }),
    };
});

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

const buildCheckResult = (overrides: Partial<SubscriptionEstimation> = {}): SubscriptionEstimation =>
    ({
        Amount: 11988,
        AmountDue: 11988,
        Currency: 'CHF',
        Cycle: 12,
        Proration: 0,
        CouponDiscount: 0,
        Credit: 0,
        Coupon: null,
        Gift: 0,
        Taxes: [],
        TaxInclusive: 1,
        PeriodEnd: 0,
        RenewCycle: 12,
        SubscriptionMode: 0,
        BaseRenewAmount: null,
        RenewDiscount: 0,
        optimistic: false,
        requestData: { Plans: { [PLANS.BUNDLE]: 1 }, Currency: 'CHF', Cycle: 12 },
        ...overrides,
    }) as unknown as SubscriptionEstimation;

/**
 * Renders the payments context and exposes it to the test, capturing a snapshot on every render so that
 * intermediate states during `initialize()` can be asserted on.
 */
const renderPaymentsContext = () => {
    const snapshots: { initialized: boolean; telemetryContext: string }[] = [];
    const contextRef: { current: PaymentsContextType | undefined } = { current: undefined };
    let initializeResolved = false;

    const Probe = () => {
        const payments = usePayments();
        const initializeRef = useRef(false);

        contextRef.current = payments;
        snapshots.push({ initialized: payments.initialized, telemetryContext: payments.telemetryContext });

        useEffect(() => {
            if (initializeRef.current) {
                return;
            }
            initializeRef.current = true;

            void payments
                .initialize({
                    api: undefined as any,
                    paymentFlow: 'signup',
                    onChargeable: async () => {},
                    paramCurrency: 'CHF',
                    planToCheck: { planIDs: { [PLANS.BUNDLE]: 1 }, cycle: 12 },
                    telemetryContext: 'ctx-signup-referral',
                    product: 'generic',
                })
                .then(() => {
                    initializeResolved = true;
                });
        }, []);

        return null;
    };

    const { Wrapper } = getStoreWrapper({
        preloadedState: { plans: getModelState({ plans: getLongTestPlans('CHF'), freePlan: FREE_PLAN }) },
    });

    render(
        <Wrapper>
            <PaymentsContextProvider preload={false} authenticated={false}>
                <Probe />
            </PaymentsContextProvider>
        </Wrapper>
    );

    return {
        snapshots,
        getContext: () => contextRef.current!,
        hasInitializeResolved: () => initializeResolved,
    };
};

describe('payments context telemetry', () => {
    let sendCustomEvent: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        sendCustomEvent = jest.spyOn(telemetry, 'sendCustomEvent').mockImplementation(() => {});
    });

    afterEach(() => {
        sendCustomEvent.mockRestore();
    });

    const getEvent = (name: string) => sendCustomEvent.mock.calls.find(([eventName]) => eventName === name);

    describe('telemetryContext', () => {
        it('reports initialized before initialize() resolves, so consumers must not use it to gate telemetry', async () => {
            const check = createDeferred<SubscriptionEstimation>();
            checkSubscription.mockReturnValue(check.promise);

            const { snapshots, hasInitializeResolved } = renderPaymentsContext();

            // The essential payments data resolves from the preloaded store at the start of initialize(), which is
            // what `initialized` reflects. The check call is still pending, so initialize() has not resolved and the
            // telemetry context has not been applied yet.
            await waitFor(() => expect(snapshots.some((snapshot) => snapshot.initialized)).toBe(true));
            expect(hasInitializeResolved()).toBe(false);

            const firstInitialized = snapshots.find((snapshot) => snapshot.initialized)!;
            expect(firstInitialized.telemetryContext).toBe('other');
        });

        it('applies the flow telemetry context once initialize() resolves', async () => {
            const check = createDeferred<SubscriptionEstimation>();
            checkSubscription.mockReturnValue(check.promise);

            const { getContext, hasInitializeResolved } = renderPaymentsContext();

            check.resolve(buildCheckResult());

            await waitFor(() => expect(hasInitializeResolved()).toBe(true));
            expect(getContext().telemetryContext).toBe('ctx-signup-referral');
        });
    });

    describe('isTrial', () => {
        const initializeAndSettle = async () => {
            checkSubscription.mockResolvedValue(buildCheckResult());

            const harness = renderPaymentsContext();
            await waitFor(() => expect(harness.hasInitializeResolved()).toBe(true));

            return harness;
        };

        it('falls back to the requested trial when no resolver is registered', async () => {
            const { getContext } = await initializeAndSettle();

            expect(getContext().isTrial).toBe(false);

            await getContext().selectNewPlan({
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: 1,
                currency: 'CHF',
                trial: true,
            });

            await waitFor(() => expect(getEvent('ctx_signup_referral_estimation_change')).toBeDefined());
            const [, payload] = getEvent('ctx_signup_referral_estimation_change')!;
            expect(payload.action).toBe('cycle_changed');
            expect(payload.isTrial).toBe(true);
        });

        it('reports false without a resolver when no trial was requested, even for a trial-eligible plan', async () => {
            const { getContext } = await initializeAndSettle();

            await getContext().selectNewPlan({
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: 1,
                currency: 'CHF',
            });

            await waitFor(() => expect(getEvent('ctx_signup_referral_estimation_change')).toBeDefined());
            expect(getEvent('ctx_signup_referral_estimation_change')![1].isTrial).toBe(false);
        });

        it('uses the registered resolver instead of the requested trial', async () => {
            const { getContext } = await initializeAndSettle();

            getContext().setIsTrialResolver(() => true);

            await waitFor(() => expect(getContext().isTrial).toBe(true));

            await getContext().selectNewPlan({
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: 1,
                currency: 'CHF',
            });

            await waitFor(() => expect(getEvent('ctx_signup_referral_estimation_change')).toBeDefined());
            expect(getEvent('ctx_signup_referral_estimation_change')![1].isTrial).toBe(true);
        });

        it('resolves per plan, so a plan change is reported with that plan trial status', async () => {
            const { getContext } = await initializeAndSettle();

            getContext().setIsTrialResolver((planIDs) => !!planIDs[PLANS.MAIL]);

            await getContext().selectNewPlan({
                planIDs: { [PLANS.MAIL]: 1 },
                cycle: 12,
                currency: 'CHF',
            });

            await waitFor(() => expect(getEvent('ctx_signup_referral_estimation_change')).toBeDefined());
            const [, payload] = getEvent('ctx_signup_referral_estimation_change')!;
            expect(payload.action).toBe('plan_changed');
            expect(payload.selectedPlanName).toBe(PLANS.MAIL);
            expect(payload.isTrial).toBe(true);
        });

        it('stops using the resolver once it is cleared', async () => {
            const { getContext } = await initializeAndSettle();

            getContext().setIsTrialResolver(() => true);
            await waitFor(() => expect(getContext().isTrial).toBe(true));

            getContext().setIsTrialResolver(undefined);

            await getContext().selectNewPlan({
                planIDs: { [PLANS.BUNDLE]: 1 },
                cycle: 1,
                currency: 'CHF',
            });

            await waitFor(() => expect(getEvent('ctx_signup_referral_estimation_change')).toBeDefined());
            expect(getEvent('ctx_signup_referral_estimation_change')![1].isTrial).toBe(false);
        });
    });
});
