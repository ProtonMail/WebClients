import { act, render } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { getStoreWrapper } from '@proton/payments-hooks/testing/renderWithProviders';
import { type PaymentsContextType, usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { EntitlementCatalog } from '@proton/payments/core/entitlements/interface';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { GUARD_ERROR_CODES, type GuardError } from '@proton/payments/core/subscription/guard';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { multiSubscriptionTestCatalog } from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { useFlag } from '@proton/unleash/useFlag';

import { PaymentsContextProvider } from './PaymentContext';

const checkSubscription = jest.fn();

jest.mock('@proton/unleash/useFlag', () => ({
    useFlag: jest.fn().mockReturnValue(false),
}));

jest.mock('@proton/payments-hooks/react-extensions/usePaymentsApi', () => {
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

const guardError: GuardError = { Code: GUARD_ERROR_CODES.TOO_LITTLE_SPACE, Message: 'raw' };

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
        requestData: { Plans: { [PLANS.VPN2024]: 1 }, Currency: 'CHF', Cycle: 12 },
        GuardResult: [],
        ...overrides,
    }) as unknown as SubscriptionEstimation;

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
};

/** Mimics the real api client: a request whose signal gets aborted rejects instead of resolving. */
const respondWith = (signal: AbortSignal | undefined, result: Promise<SubscriptionEstimation>) =>
    new Promise<SubscriptionEstimation>((resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        result.then(resolve, reject);
    });

const driveYearly = { planIDs: { [PLANS.DRIVE]: 1 }, cycle: CYCLE.YEARLY, currency: 'CHF' as const };
const vpnYearly = { planIDs: { [PLANS.VPN2024]: 1 }, cycle: CYCLE.YEARLY, currency: 'CHF' as const };
const vpnTwoYears = { ...vpnYearly, cycle: CYCLE.TWO_YEARS };

const getSubscriptionState = (subscription: Subscription) => ({
    ...getModelState(subscription),
    meta: { fetchedAt: 0, fetchedEphemeral: undefined, type: 1 },
});

const currentSubscriptionState = getSubscriptionState(
    buildSubscription({ planName: PLANS.DRIVE, cycle: CYCLE.YEARLY, currency: 'CHF' })
);

const renderContext = ({
    withGuards,
    subscriptionState = currentSubscriptionState,
    plans = getLongTestPlans('CHF'),
    entitlementCatalog,
}: {
    withGuards?: boolean;
    subscriptionState?: ReturnType<typeof getSubscriptionState>;
    plans?: Plan[];
    entitlementCatalog?: EntitlementCatalog;
} = {}) => {
    const contextRef: { current: PaymentsContextType | undefined } = { current: undefined };

    const Probe = () => {
        contextRef.current = usePayments();
        return null;
    };

    const { Wrapper } = getStoreWrapper({
        preloadedState: {
            plans: getModelState({ plans, freePlan: FREE_PLAN }),
            subscription: subscriptionState,
            ...(entitlementCatalog && { entitlementCatalog: getModelState(entitlementCatalog) }),
        },
    });

    render(
        <Wrapper>
            <PaymentsContextProvider preload={false} withGuards={withGuards}>
                <Probe />
            </PaymentsContextProvider>
        </Wrapper>
    );

    const getContext = () => contextRef.current!;

    return {
        select: (planToCheck: Parameters<PaymentsContextType['selectNewPlan']>[0]) =>
            act(() =>
                getContext()
                    .selectNewPlan(planToCheck)
                    .then(undefined, () => undefined)
            ),
        getContext,
    };
};

const sentData = () => checkSubscription.mock.calls.map(([data]) => data);

describe('PaymentsContext subscription guards', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        checkSubscription.mockImplementation((_data, { signal } = {}) =>
            respondWith(signal, Promise.resolve(buildCheckResult()))
        );
    });

    it('does not send ValidateGuards when the provider did not opt in', async () => {
        const { select } = renderContext();

        await select(vpnYearly);

        expect(sentData()[0]).not.toHaveProperty('ValidateGuards', true);
    });

    it('sends ValidateGuards once when a paid subscriber settles on a different selection', async () => {
        const { select } = renderContext({ withGuards: true });

        await select(vpnYearly);

        expect(sentData()).toHaveLength(1);
        expect(sentData()[0]).toMatchObject({ ValidateGuards: true });
    });

    it('sends no check at all when the selection equals the current subscription', async () => {
        const { select } = renderContext({ withGuards: true });

        await select(driveYearly);

        expect(sentData()).toHaveLength(0);
    });

    it('exposes the guard errors next to the pricing from the same response', async () => {
        checkSubscription.mockResolvedValue(buildCheckResult({ GuardResult: [guardError], AmountDue: 4242 }));
        const { select, getContext } = renderContext({ withGuards: true });

        await select(vpnYearly);

        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
        expect(getContext().checkResult.AmountDue).toBe(4242);
    });

    it('clears the stale guard errors synchronously when the selection changes, before the new response lands', async () => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);

        const pending = createDeferred<SubscriptionEstimation>();
        checkSubscription.mockImplementationOnce((_data, { signal } = {}) => respondWith(signal, pending.promise));
        let selection!: Promise<unknown>;
        act(() => {
            selection = getContext().selectNewPlan(vpnTwoYears);
        });

        expect(getContext().checkResult.GuardResult).toEqual([]);
        expect(sentData()[1]).toMatchObject({ ValidateGuards: true, Cycle: CYCLE.TWO_YEARS });

        await act(async () => {
            pending.resolve(buildCheckResult());
            await selection;
        });
        expect(getContext().checkResult.GuardResult).toEqual([]);
    });

    it('shows the new guard errors after switching from a passing selection to a blocked one', async () => {
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);
        expect(getContext().checkResult.GuardResult).toEqual([]);

        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        await select(vpnTwoYears);

        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });

    it('keeps the guard verdict and skips validation on a passive re-check of the same selection', async () => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);

        await select({ ...vpnYearly, currency: 'EUR' });

        expect(sentData()[1].ValidateGuards).toBeFalsy();
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });

    it('validates again when returning to a previously guarded selection through the current subscription', async () => {
        const { select, getContext } = renderContext({ withGuards: true });
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        await select(vpnYearly);
        await select(driveYearly);
        expect(getContext().checkResult.GuardResult ?? []).toEqual([]);

        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        await select(vpnYearly);

        expect(sentData().filter((data) => data.ValidateGuards === true)).toHaveLength(2);
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });

    it('only displays the latest response when selections change rapidly', async () => {
        const first = createDeferred<SubscriptionEstimation>();
        const second = createDeferred<SubscriptionEstimation>();
        checkSubscription
            .mockImplementationOnce((_data, { signal } = {}) => respondWith(signal, first.promise))
            .mockImplementationOnce((_data, { signal } = {}) => respondWith(signal, second.promise));
        const { getContext } = renderContext({ withGuards: true });

        let firstSelection!: Promise<unknown>;
        let secondSelection!: Promise<unknown>;
        act(() => {
            firstSelection = getContext()
                .selectNewPlan(vpnYearly)
                .catch(() => undefined);
            secondSelection = getContext()
                .selectNewPlan(vpnTwoYears)
                .catch(() => undefined);
        });

        await act(async () => {
            second.resolve(buildCheckResult({ GuardResult: [] }));
            first.resolve(buildCheckResult({ GuardResult: [guardError] }));
            await Promise.all([firstSelection, secondSelection]);
        });

        expect(getContext().checkResult.GuardResult).toEqual([]);
    });

    it('validates again when a passive re-check (coupon change) cancels a pending validating check', async () => {
        const pending = createDeferred<SubscriptionEstimation>();
        checkSubscription
            .mockImplementationOnce((_data, { signal } = {}) => respondWith(signal, pending.promise))
            .mockImplementationOnce((_data, { signal } = {}) =>
                respondWith(signal, Promise.resolve(buildCheckResult({ GuardResult: [guardError] })))
            );
        const { getContext } = renderContext({ withGuards: true });

        let validatingSelection!: Promise<unknown>;
        let couponSelection!: Promise<unknown>;
        act(() => {
            validatingSelection = getContext()
                .selectNewPlan(vpnYearly)
                .catch(() => undefined);
            couponSelection = getContext()
                .selectNewPlan({ ...vpnYearly, coupon: 'GIFT' })
                .catch(() => undefined);
        });
        await act(async () => {
            await Promise.all([validatingSelection, couponSelection]);
        });

        expect(sentData()[1]).toMatchObject({ ValidateGuards: true });
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });

    it('validates again when returning to a guarded selection while another validation is pending', async () => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);

        const pending = createDeferred<SubscriptionEstimation>();
        checkSubscription
            .mockImplementationOnce((_data, { signal } = {}) => respondWith(signal, pending.promise))
            .mockImplementationOnce((_data, { signal } = {}) =>
                respondWith(signal, Promise.resolve(buildCheckResult({ GuardResult: [guardError] })))
            );
        let twoYearsSelection!: Promise<unknown>;
        let backToYearlySelection!: Promise<unknown>;
        act(() => {
            twoYearsSelection = getContext()
                .selectNewPlan(vpnTwoYears)
                .catch(() => undefined);
            backToYearlySelection = getContext()
                .selectNewPlan(vpnYearly)
                .catch(() => undefined);
        });
        await act(async () => {
            await Promise.all([twoYearsSelection, backToYearlySelection]);
        });

        expect(sentData()[2]).toMatchObject({ ValidateGuards: true, Cycle: CYCLE.YEARLY });
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });

    it('validates again after a validating check answered with a frontend-built optimistic result', async () => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ optimistic: true, GuardResult: undefined }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);

        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        await select({ ...vpnYearly, coupon: 'GIFT' });

        expect(sentData()[1]).toMatchObject({ ValidateGuards: true });
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });

    it.each([
        ['a free plan', { ...vpnYearly, planIDs: {} }],
        ['the current subscription', driveYearly],
    ])('drops a pending check when the user switches to %s', async (_case, nextSelection) => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);

        const pending = createDeferred<SubscriptionEstimation>();
        checkSubscription.mockImplementationOnce((_data, { signal } = {}) => respondWith(signal, pending.promise));
        let passiveSelection!: Promise<unknown>;
        act(() => {
            passiveSelection = getContext()
                .selectNewPlan({ ...vpnYearly, currency: 'EUR' })
                .catch(() => undefined);
        });
        await select(nextSelection);
        await act(async () => {
            pending.resolve(buildCheckResult({ AmountDue: 4242 }));
            await passiveSelection;
        });

        expect(getContext().checkResult.AmountDue).not.toBe(4242);
        expect(getContext().checkResult.GuardResult ?? []).toEqual([]);
    });

    it('carries the guard verdict forward without changing the API response object', async () => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);

        const passiveResponse = buildCheckResult();
        checkSubscription.mockResolvedValueOnce(passiveResponse);
        await select({ ...vpnYearly, currency: 'EUR' });

        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
        expect(passiveResponse.GuardResult).toEqual([]);
    });

    it('keeps the guard verdict when a passive re-check fails and the next one succeeds', async () => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);

        checkSubscription.mockRejectedValueOnce(new Error('network down'));
        await select({ ...vpnYearly, currency: 'EUR' });
        await select({ ...vpnYearly, currency: 'USD' });

        expect(sentData()[2].ValidateGuards).toBeFalsy();
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });

    it('leaves no guard verdict and does not throw when the check fails, so the user can retry', async () => {
        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        const { select, getContext } = renderContext({ withGuards: true });
        await select(vpnYearly);

        checkSubscription.mockRejectedValueOnce(new Error('network down'));
        await select(vpnTwoYears);
        expect(getContext().checkResult.GuardResult ?? []).toEqual([]);

        checkSubscription.mockResolvedValueOnce(buildCheckResult({ GuardResult: [guardError] }));
        await select(vpnTwoYears);

        expect(sentData()[2]).toMatchObject({ ValidateGuards: true });
        expect(getContext().checkResult.GuardResult).toEqual([guardError]);
    });
});

describe('PaymentsContext currency for the selection', () => {
    const webMailPlusInUsdState = getSubscriptionState(
        buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'USD' })
    );
    const lumoMonthlyInChf = { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.MONTHLY, currency: 'CHF' as const };

    const renderWithWebMailPlusInUsd = () =>
        renderContext({
            subscriptionState: webMailPlusInUsdState,
            plans: [...getLongTestPlans('CHF'), ...getLongTestPlans('USD')],
            entitlementCatalog: multiSubscriptionTestCatalog,
        });

    beforeEach(() => {
        jest.clearAllMocks();
        checkSubscription.mockImplementation((data, { signal } = {}) =>
            respondWith(signal, Promise.resolve(buildCheckResult({ Currency: data.Currency })))
        );
    });

    afterEach(() => {
        jest.mocked(useFlag).mockReturnValue(false);
    });

    it('checks Lumo added next to web Mail Plus in the Mail Plus currency', async () => {
        jest.mocked(useFlag).mockImplementation((flag) => flag === 'LumoMultiSubscriptions');
        const { select } = renderWithWebMailPlusInUsd();

        await select(lumoMonthlyInChf);

        expect(sentData()[0]).toEqual(expect.objectContaining({ Plans: { [PLANS.LUMO]: 1 }, Currency: 'USD' }));
    });

    it('checks in the requested currency with the flag off', async () => {
        const { select } = renderWithWebMailPlusInUsd();

        await select(lumoMonthlyInChf);

        expect(sentData()[0]).toEqual(expect.objectContaining({ Plans: { [PLANS.LUMO]: 1 }, Currency: 'CHF' }));
    });
});
