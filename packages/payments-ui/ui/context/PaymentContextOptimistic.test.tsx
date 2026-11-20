import { act, render } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { getStoreWrapper } from '@proton/payments-hooks/testing/vitest/renderWithProviders';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PaymentStatus, PaymentsApi } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';

import {
    PaymentsContextOptimisticProvider,
    type PaymentsContextOptimisticType,
    usePaymentOptimistic,
} from './PaymentContextOptimistic';

const checkResult = {
    Amount: 11988,
    AmountDue: 11988,
    Currency: 'CHF',
    Cycle: 12,
    CouponDiscount: 0,
    Coupon: null,
    Taxes: [],
    SubscriptionMode: 0,
    requestData: { Plans: { [PLANS.VPN2024]: 1 }, Currency: 'CHF', Cycle: 12 },
} as unknown as SubscriptionEstimation;

const checkSubscription = vi.fn();

vi.mock('@proton/payments-hooks/react-extensions/usePaymentsApi', () => {
    const paymentsApi = {
        checkSubscription: (...args: any[]) => checkSubscription(...args),
        cacheMultiCheck: vi.fn(),
        multiCheck: vi.fn().mockResolvedValue([]),
        getFullBillingAddress: vi.fn().mockResolvedValue({}),
    } as unknown as PaymentsApi;

    return {
        usePaymentsApi: () => ({ paymentsApi, getPaymentsApi: () => paymentsApi }),
    };
});

const paymentStatus = {
    CountryCode: 'CH',
    State: null,
    VendorStates: { Card: true, Paypal: true, Apple: true, Cash: true, Bitcoin: true, Google: true },
} as unknown as PaymentStatus;

const renderProvider = ({
    loadedPaymentStatus = paymentStatus,
    optimisticVendorStates,
}: {
    /** null: the payment status hasn't loaded */
    loadedPaymentStatus?: PaymentStatus | null;
    optimisticVendorStates?: Partial<PaymentStatus['VendorStates']>;
} = {}) => {
    const contextRef: { current: PaymentsContextOptimisticType | undefined } = { current: undefined };

    const Probe = () => {
        contextRef.current = usePaymentOptimistic();
        return null;
    };

    const { Wrapper } = getStoreWrapper({
        preloadedState: {
            plans: getModelState({ plans: getLongTestPlans('CHF'), freePlan: FREE_PLAN }),
            paymentStatus: getModelState(loadedPaymentStatus ?? undefined),
        },
    });

    render(
        <Wrapper>
            <PaymentsContextOptimisticProvider
                preload={false}
                authenticated={false}
                optimisticVendorStates={optimisticVendorStates}
            >
                <Probe />
            </PaymentsContextOptimisticProvider>
        </Wrapper>
    );

    return () => contextRef.current!;
};

const initialize = (getContext: () => PaymentsContextOptimisticType) =>
    act(() =>
        getContext()
            .initialize({
                api: vi.fn() as any,
                planToCheck: { planIDs: { [PLANS.VPN2024]: 1 }, cycle: CYCLE.YEARLY },
                paramCurrency: 'CHF',
                paymentFlow: 'signup',
                onChargeable: async () => {},
                telemetryContext: 'other',
                product: 'proton-vpn-settings',
            })
            .catch(() => undefined)
    );

describe('PaymentsContextOptimisticProvider initialization status', () => {
    beforeEach(() => vi.clearAllMocks());

    it('reports the prices as initialized once they load', async () => {
        checkSubscription.mockResolvedValue(checkResult);
        const getContext = renderProvider();

        await initialize(getContext);

        expect(getContext().initializationStatus).toEqual(
            expect.objectContaining({ pricingInitialized: true, error: undefined })
        );
    });

    it('reports a failed initialization when the prices cannot be checked', async () => {
        const error = new Error('network down');
        checkSubscription.mockRejectedValue(error);
        const getContext = renderProvider();

        await initialize(getContext);

        expect(getContext().initializationStatus).toEqual(
            expect.objectContaining({ pricingInitialized: false, error })
        );
    });
});

describe('PaymentsContextOptimisticProvider payment status', () => {
    it('guesses the usual payment methods, and those the page offers, until the payment status loads', () => {
        const getContext = renderProvider({ loadedPaymentStatus: null, optimisticVendorStates: { Bitcoin: true } });

        expect(getContext().paymentStatus).toBeUndefined();
        expect(getContext().optimisticPaymentStatus.VendorStates).toEqual(
            expect.objectContaining({ Card: true, Paypal: true, Google: true, Bitcoin: true, Apple: false })
        );
    });

    it('is the loaded payment status once there is one', () => {
        const getContext = renderProvider({ optimisticVendorStates: { Bitcoin: false } });

        expect(getContext().optimisticPaymentStatus).toBe(getContext().paymentStatus);
    });
});
