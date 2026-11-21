import type { ReactNode } from 'react';

import { act, render, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { getStoreWrapper } from '@proton/payments-hooks/testing/vitest/renderWithProviders';
import { type PaymentsContextType, usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import { PAYMENTS_API_ERROR_CODES } from '@proton/payments/core/api-error-codes';
import type { BillingAddressExtraProperties } from '@proton/payments/core/billing-address/billing-address';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { EntitlementCatalog } from '@proton/payments/core/entitlements/interface';
import type { PaymentStatus } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { GUARD_ERROR_CODES, type GuardError } from '@proton/payments/core/subscription/guard';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { multiSubscriptionTestCatalog } from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { addApiMock, apiMock } from '@proton/test-api/vitest/api';
import { useFlag } from '@proton/unleash/useFlag';

import { useBillingAddress } from '../billing-address/hooks/useBillingAddress';
import { PaymentsContextProvider } from './PaymentContext';

const checkSubscription = vi.fn();
// The checks go through the real payments api, to the mocked endpoint
addApiMock('payments/v5/subscription/check', ({ data, signal, silence }) =>
    checkSubscription(data, { signal, silence })
);

const createNotification = vi.fn();

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification }),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn().mockReturnValue(false),
}));

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
    paymentStatus,
    billingDetails,
    onRender,
    children,
}: {
    withGuards?: boolean;
    paymentStatus?: PaymentStatus;
    billingDetails?: BillingAddressExtraProperties;
    subscriptionState?: ReturnType<typeof getSubscriptionState>;
    plans?: Plan[];
    entitlementCatalog?: EntitlementCatalog;
    /** Reads the context while rendering, as a consumer does */
    onRender?: (context: PaymentsContextType) => void;
    children?: ReactNode;
} = {}) => {
    const contextRef: { current: PaymentsContextType | undefined } = { current: undefined };

    const Probe = () => {
        contextRef.current = usePayments();
        onRender?.(contextRef.current);
        return null;
    };

    const { Wrapper } = getStoreWrapper({
        preloadedState: {
            plans: getModelState({ plans, freePlan: FREE_PLAN }),
            subscription: subscriptionState,
            ...(entitlementCatalog && { entitlementCatalog: getModelState(entitlementCatalog) }),
            ...(paymentStatus && { paymentStatus: getModelState(paymentStatus) }),
        },
    });

    render(
        <Wrapper>
            <PaymentsContextProvider preload={false} withGuards={withGuards} billingDetails={billingDetails}>
                <Probe />
                {children}
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
/** The checks of the prices shown next to the selection, which are sent silently */
const multiCheckedData = () => checkSubscription.mock.calls.filter(([, { silence }]) => silence).map(([data]) => data);

describe('PaymentsContext subscription guards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
        expect(getContext().loading).toBe(false);
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
        vi.clearAllMocks();
        checkSubscription.mockImplementation((data, { signal } = {}) =>
            respondWith(signal, Promise.resolve(buildCheckResult({ Currency: data.Currency })))
        );
    });

    afterEach(() => {
        vi.mocked(useFlag).mockReturnValue(false);
    });

    it('checks Lumo added next to web Mail Plus in the Mail Plus currency', async () => {
        vi.mocked(useFlag).mockImplementation((flag) => flag === 'LumoMultiSubscriptions');
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

const paymentStatus = {
    CountryCode: 'DE',
    State: null,
    VendorStates: { Card: true, Paypal: true, Apple: true, Cash: true, Bitcoin: true, Google: true },
} as unknown as PaymentStatus;

describe('PaymentsContext VAT number', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkSubscription.mockImplementation((data, { signal } = {}) =>
            respondWith(signal, Promise.resolve(buildCheckResult({ Currency: data.Currency })))
        );
    });

    const initialize = (getContext: () => PaymentsContextType, vatNumber?: string) =>
        act(() =>
            getContext().initialize({
                api: apiMock,
                planToCheck: { planIDs: vpnYearly.planIDs, cycle: vpnYearly.cycle },
                paramCurrency: 'CHF',
                vatNumber,
                paymentFlow: 'signup',
                onChargeable: async () => {},
                telemetryContext: 'other',
                product: 'proton-vpn-settings',
            })
        );

    it('includes the VAT number given on initialization in the first check', async () => {
        const { getContext } = renderContext({ paymentStatus });

        await initialize(getContext, 'DE123456789');

        expect(sentData()[0]).toEqual(expect.objectContaining({ VatId: 'DE123456789' }));
        expect(getContext().vatNumber).toBe('DE123456789');
    });

    it('fills in the billing address with the details given, from the first render on, without sending them in checks', async () => {
        const { getContext } = renderContext({
            paymentStatus,
            billingDetails: { Company: 'Acme', FirstName: 'Ada', City: undefined },
        });
        // A billing form reads its initial address once, before the prices load
        expect(getContext().billingAddress).toEqual(expect.objectContaining({ Company: 'Acme', FirstName: 'Ada' }));

        await initialize(getContext);

        expect(getContext().billingAddress).toEqual(
            expect.objectContaining({ CountryCode: 'DE', Company: 'Acme', FirstName: 'Ada' })
        );
        // A price check only needs where the user pays from
        expect(sentData()[0].BillingAddress).not.toHaveProperty('Company');
        expect(sentData()[0].BillingAddress).not.toHaveProperty('FirstName');
        // A missing detail isn't added as an empty field, which the subscription rejects
        expect(getContext().billingAddress).not.toHaveProperty('City');

        // What the user types in the billing form wins over the link's details
        act(() => {
            getContext().selectFullBillingAddress({ CountryCode: 'DE', State: null, Company: 'Typed' });
        });
        await waitFor(() =>
            expect(getContext().billingAddress).toEqual(expect.objectContaining({ Company: 'Typed', FirstName: 'Ada' }))
        );
    });

    it('checks the available plans along with the selection, each with its own coupon', async () => {
        const pending = createDeferred<SubscriptionEstimation>();
        checkSubscription.mockImplementation((_data, { signal, silence } = {}) =>
            respondWith(signal, silence ? Promise.resolve(buildCheckResult()) : pending.promise)
        );
        const { getContext } = renderContext({ paymentStatus });

        let initialized = false;
        const initializing = getContext()
            .initialize({
                api: apiMock,
                planToCheck: { planIDs: vpnYearly.planIDs, cycle: vpnYearly.cycle, coupon: 'SELECTION' },
                availablePlans: [
                    { planIDs: vpnTwoYears.planIDs, cycle: vpnTwoYears.cycle },
                    { planIDs: { [PLANS.VPN_PASS_BUNDLE]: 1 }, cycle: CYCLE.YEARLY, coupon: 'OWN' },
                    { planIDs: { [PLANS.VPN_PASS_BUNDLE]: 1 }, cycle: CYCLE.TWO_YEARS, coupon: undefined },
                ],
                paramCurrency: 'CHF',
                paymentFlow: 'signup',
                onChargeable: async () => {},
                telemetryContext: 'other',
                product: 'proton-vpn-settings',
            })
            .then(() => {
                initialized = true;
            });

        await waitFor(() => expect(multiCheckedData()).toHaveLength(3));
        // The selection's check is still pending
        expect(initialized).toBe(false);
        // Without a coupon of its own, a plan gets the selection's; with one, that one; with none, its automatic one
        expect(multiCheckedData().map((data) => data.Codes)).toEqual([['SELECTION'], ['OWN'], ['VPNPASSINTRO2026']]);

        await act(async () => {
            pending.resolve(buildCheckResult());
            await initializing;
        });
        expect(initialized).toBe(true);
    });

    it('leaves the selection out of the available plans, as its own check caches its price', async () => {
        const { getContext } = renderContext({ paymentStatus });

        await act(() =>
            getContext().initialize({
                api: apiMock,
                planToCheck: { planIDs: vpnYearly.planIDs, cycle: vpnYearly.cycle, coupon: 'SELECTION' },
                availablePlans: [
                    { planIDs: vpnYearly.planIDs, cycle: vpnYearly.cycle },
                    { planIDs: vpnTwoYears.planIDs, cycle: vpnTwoYears.cycle },
                ],
                paramCurrency: 'CHF',
                paymentFlow: 'signup',
                onChargeable: async () => {},
                telemetryContext: 'other',
                product: 'proton-vpn-settings',
            })
        );

        expect(multiCheckedData().map((data) => data.Cycle)).toEqual([CYCLE.TWO_YEARS]);
    });

    it('renders again once multiple plans are checked, so the prices found in the cache show', async () => {
        const planToCheck = { ...vpnTwoYears, coupon: 'COUPON' };
        const renderedAmounts: (number | undefined)[] = [];
        const { getContext } = renderContext({
            paymentStatus,
            onRender: (context) => renderedAmounts.push(context.getPrice(planToCheck)?.checkResult.AmountDue),
        });
        await initialize(getContext);
        expect(renderedAmounts.at(-1)).toBeUndefined();

        checkSubscription.mockImplementation((data, { signal } = {}) =>
            respondWith(signal, Promise.resolve(buildCheckResult({ Cycle: data.Cycle, AmountDue: 4242 })))
        );
        await act(() => getContext().checkMultiplePlans([planToCheck]));

        expect(renderedAmounts.at(-1)).toBe(4242);
    });
});

describe('PaymentsContext changes made while a check runs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkSubscription.mockImplementation((data, { signal } = {}) =>
            respondWith(signal, Promise.resolve(buildCheckResult({ Currency: data.Currency, Cycle: data.Cycle })))
        );
    });

    /** The next check runs until a newer change aborts it */
    const holdNextCheck = () =>
        checkSubscription.mockImplementationOnce((_data, { signal } = {}) =>
            respondWith(signal, createDeferred<SubscriptionEstimation>().promise)
        );

    it('keeps a cycle change when the billing country changes before its check returns', async () => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);

        holdNextCheck();
        act(() => {
            void getContext()
                .selectCycle(CYCLE.TWO_YEARS)
                .catch(() => undefined);
            getContext().selectFullBillingAddress({ CountryCode: 'FR', State: null });
        });

        await waitFor(() => expect(getContext().billingAddress.CountryCode).toBe('FR'));
        expect(getContext().selectedPlan.cycle).toBe(CYCLE.TWO_YEARS);
        expect(sentData().at(-1)).toMatchObject({ Cycle: CYCLE.TWO_YEARS, BillingAddress: { CountryCode: 'FR' } });
    });

    it('stays loading until the check of the latest change returns, so the previous price cannot be paid', async () => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);

        holdNextCheck();
        const countryCheck = createDeferred<SubscriptionEstimation>();
        checkSubscription.mockImplementationOnce((_data, { signal } = {}) => respondWith(signal, countryCheck.promise));
        let cycleSelection!: Promise<unknown>;
        act(() => {
            cycleSelection = getContext()
                .selectCycle(CYCLE.TWO_YEARS)
                .catch(() => undefined);
            getContext().selectFullBillingAddress({ CountryCode: 'FR', State: null });
        });
        // The cycle check is aborted, the country check carries the cycle
        await act(() => cycleSelection);

        expect(getContext().loading).toBe(true);
        await act(async () => {
            countryCheck.resolve(buildCheckResult({ Cycle: CYCLE.TWO_YEARS }));
        });
        await waitFor(() => expect(getContext().loading).toBe(false));
    });

    it('keeps a billing country change when another plan is selected before its check returns', async () => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);

        holdNextCheck();
        act(() => {
            getContext().selectFullBillingAddress({ CountryCode: 'FR', State: null });
            void getContext()
                .selectNewPlan(vpnTwoYears)
                .catch(() => undefined);
        });

        await waitFor(() => expect(getContext().selectedPlan.cycle).toBe(CYCLE.TWO_YEARS));
        // The subscription is created with this billing address
        expect(getContext().billingAddress.CountryCode).toBe('FR');
        expect(sentData().at(-1)).toMatchObject({ Cycle: CYCLE.TWO_YEARS, BillingAddress: { CountryCode: 'FR' } });
    });

    it('keeps a billing country change when the VAT number is cleared before its check returns', async () => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);
        act(() => {
            getContext().setVatNumber('DE123456789');
        });
        await waitFor(() => expect(getContext().vatNumber).toBe('DE123456789'));

        holdNextCheck();
        act(() => {
            getContext().selectFullBillingAddress({ CountryCode: 'FR', State: null });
            // The billing form clears the VAT number of the previous country, which is checked 500 ms later
            getContext().setVatNumber('');
        });

        await waitFor(() => expect(getContext().vatNumber).toBe(''));
        expect(getContext().billingAddress.CountryCode).toBe('FR');
        expect(sentData().at(-1)).toMatchObject({ BillingAddress: { CountryCode: 'FR' } });
        expect(sentData().at(-1)).not.toHaveProperty('VatId');
    });

    it('keeps the company details when a VAT number is entered before their check returns', async () => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);

        holdNextCheck();
        act(() => {
            getContext().selectFullBillingAddress({
                CountryCode: 'DE',
                State: null,
                Company: 'Acme',
                Address: 'Main 1',
                City: 'Berlin',
                VatId: '',
            });
        });
        await waitFor(() => expect(sentData()).toHaveLength(2));
        act(() => {
            getContext().setVatNumber('DE123456789');
        });

        await waitFor(() => expect(getContext().vatNumber).toBe('DE123456789'));
        expect(getContext().billingAddress).toEqual(
            expect.objectContaining({ Company: 'Acme', Address: 'Main 1', City: 'Berlin' })
        );
        expect(sentData().at(-1)).toMatchObject({ VatId: 'DE123456789', BillingAddress: { Company: 'Acme' } });
    });

    it('keeps a plan selected while initialize checks the first selection', async () => {
        holdNextCheck();
        const { getContext } = renderContext({ paymentStatus });

        let initializing!: Promise<void>;
        act(() => {
            initializing = getContext().initialize({
                api: apiMock,
                planToCheck: { planIDs: vpnYearly.planIDs, cycle: vpnYearly.cycle },
                paramCurrency: 'CHF',
                paymentFlow: 'signup',
                onChargeable: async () => {},
                telemetryContext: 'other',
                product: 'proton-vpn-settings',
            });
        });
        await waitFor(() => expect(sentData()).toHaveLength(1));

        await act(async () => {
            await getContext()
                .selectNewPlan(vpnTwoYears)
                .catch(() => undefined);
            await initializing;
        });

        // The first selection isn't checked again in another currency, which would replace the user's
        expect(sentData().map((data) => data.Cycle)).toEqual([CYCLE.YEARLY, CYCLE.TWO_YEARS]);
        expect(getContext().selectedPlan.cycle).toBe(CYCLE.TWO_YEARS);
    });
});

describe('PaymentsContext billing details', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkSubscription.mockImplementation((data, { signal } = {}) =>
            respondWith(signal, Promise.resolve(buildCheckResult({ Currency: data.Currency })))
        );
    });

    it('keeps the company details when the country changes, as that part of the form only sends the tax fields', async () => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);
        act(() => {
            getContext().selectFullBillingAddress({
                CountryCode: 'DE',
                State: null,
                ZipCode: null,
                Company: 'Acme',
                Address: 'Main 1',
                City: 'Berlin',
            });
        });
        await waitFor(() => expect(getContext().billingAddress.Company).toBe('Acme'));

        act(() => {
            getContext().selectFullBillingAddress({ CountryCode: 'AT', State: null, ZipCode: null });
        });

        await waitFor(() => expect(getContext().billingAddress.CountryCode).toBe('AT'));
        expect(getContext().billingAddress).toEqual(
            expect.objectContaining({ Company: 'Acme', Address: 'Main 1', City: 'Berlin' })
        );
    });

    it.each([
        ['checked at once', { CountryCode: 'CH', State: null, ZipCode: null }],
        [
            'checked after the debounce, as it also clears the ZIP code',
            { CountryCode: 'US', State: 'CA', ZipCode: '90210' },
        ],
    ])('keeps a company typed right before a country change %s', async (_, startAddress) => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);
        act(() => getContext().selectFullBillingAddress(startAddress));
        await waitFor(() => expect(getContext().billingAddress).toEqual(startAddress));

        // The business part of the form sends the whole address as it rendered it, the country part only the tax fields
        act(() => getContext().selectFullBillingAddress({ ...startAddress, Company: 'Acme' }));
        act(() => getContext().selectFullBillingAddress({ CountryCode: 'DE', State: null, ZipCode: null }));

        const expected = { CountryCode: 'DE', State: null, ZipCode: null, Company: 'Acme' };
        await waitFor(() => expect(getContext().billingAddress).toEqual(expected));
        // No change still waiting for its debounce undoes it
        await act(() => new Promise((resolve) => setTimeout(resolve, 700)));
        expect(getContext().billingAddress).toEqual(expected);
        expect(sentData().at(-1).BillingAddress).toEqual(expected);
    });

    it('keeps what the user typed or cleared over the details given, after a country change too', async () => {
        const { select, getContext } = renderContext({
            paymentStatus,
            billingDetails: { Company: 'Link Co', City: 'Link City' },
        });
        await select(vpnYearly);
        act(() => {
            getContext().selectFullBillingAddress({
                CountryCode: 'DE',
                State: null,
                ZipCode: null,
                Company: 'Typed Co',
                City: undefined,
            });
        });
        await waitFor(() => expect(getContext().billingAddress.Company).toBe('Typed Co'));
        expect(getContext().billingAddress.City).toBeUndefined();

        act(() => {
            getContext().selectFullBillingAddress({ CountryCode: 'AT', State: null, ZipCode: null });
        });

        await waitFor(() => expect(getContext().billingAddress.CountryCode).toBe('AT'));
        expect(getContext().billingAddress.Company).toBe('Typed Co');
        expect(getContext().billingAddress.City).toBeUndefined();
    });

    it('drops the VAT number and the business details once the user no longer purchases as a business', async () => {
        const form: { current?: ReturnType<typeof useBillingAddress> } = {};
        const BillingForm = () => {
            const payments = usePayments();
            form.current = useBillingAddress({
                onBillingAddressChange: payments.selectFullBillingAddress,
                onVatChange: payments.setVatNumber,
                initialBillingAddress: payments.billingAddress,
                selectedPlanName: PLANS.BUNDLE_PRO_2024,
                telemetryContext: 'other',
                isAuthenticated: false,
            });
            return null;
        };
        const { select, getContext } = renderContext({
            paymentStatus: { ...paymentStatus, CountryCode: 'BE' },
            children: <BillingForm />,
        });
        const vatForm = () => form.current!.vatNumber!;
        await select({ planIDs: { [PLANS.BUNDLE_PRO_2024]: 1 }, cycle: CYCLE.YEARLY, currency: 'CHF' });
        act(() => vatForm().setUnauthenticatedCollapsed(false));
        act(() => vatForm().setCompany('Acme'));
        act(() => vatForm().setAddress('Main 1'));
        act(() => vatForm().setCity('Brussels'));
        act(() => vatForm().setVatNumber('BE0123123123'));
        await waitFor(() => expect(getContext().vatNumber).toBe('BE0123123123'));
        expect(getContext().billingAddress.Company).toBe('Acme');

        // Unchecks "I'm purchasing as a business"
        act(() => vatForm().setUnauthenticatedCollapsed(true));

        // The VAT number and the address are debounced separately, so each can settle in its own check: wait for both
        await waitFor(() => {
            expect(getContext().vatNumber).toBe('');
            expect(getContext().billingAddress.Company).toBeUndefined();
            expect(getContext().loading).toBe(false);
        });
        expect(sentData().at(-1)).not.toHaveProperty('VatId');
    });

    it.each([
        [
            'billing address',
            (context: PaymentsContextType) =>
                context.selectFullBillingAddress({
                    CountryCode: 'DE',
                    State: null,
                    Company: 'Acme',
                    VatId: 'DE123456789',
                }),
        ],
        ['VAT number', (context: PaymentsContextType) => context.setVatNumber('DE123456789')],
    ])('drops the failed check of a %s change, as nothing can await it', async (_change, change) => {
        const onUnhandledRejection = vi.fn();
        process.on('unhandledRejection', onUnhandledRejection);
        onTestFinished(() => {
            process.off('unhandledRejection', onUnhandledRejection);
        });
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);
        let refuseCheck!: (error: unknown) => void;
        checkSubscription.mockImplementationOnce(
            () =>
                new Promise((_resolve, reject) => {
                    refuseCheck = reject;
                })
        );

        act(() => {
            change(getContext());
        });

        await waitFor(() => expect(sentData().at(-1)).toHaveProperty('VatId', 'DE123456789'));
        await waitFor(() => expect(getContext().loading).toBe(true));
        await act(async () => {
            refuseCheck({ data: { Code: PAYMENTS_API_ERROR_CODES.VAT_REVERSE_CHARGE_NOT_SUPPORTED } });
        });
        // Its failure must have settled before the next change, otherwise that change aborts it and still asks for it
        await waitFor(() => expect(getContext().loading).toBe(false));

        // The refused VAT number isn't sent again with the next change
        await act(() => getContext().selectCycle(CYCLE.TWO_YEARS));
        expect(sentData().at(-1)).toMatchObject({ Cycle: CYCLE.TWO_YEARS });
        expect(sentData().at(-1)).not.toHaveProperty('VatId');
        expect(onUnhandledRejection).not.toHaveBeenCalled();
    });

    it('keeps a cycle change when the VAT number it carries is refused, and drops that VAT number', async () => {
        const { select, getContext } = renderContext({ paymentStatus });
        await select(vpnYearly);
        // The check of the VAT number is still running when the cycle changes, which aborts it
        checkSubscription.mockImplementationOnce((_data, { signal } = {}) =>
            respondWith(signal, createDeferred<SubscriptionEstimation>().promise)
        );
        act(() => getContext().setVatNumber('DE123456789'));
        await waitFor(() => expect(sentData().at(-1)).toHaveProperty('VatId', 'DE123456789'));

        checkSubscription.mockImplementationOnce(() =>
            Promise.reject({ data: { Code: PAYMENTS_API_ERROR_CODES.VAT_REVERSE_CHARGE_NOT_SUPPORTED } })
        );
        await act(() => getContext().selectCycle(CYCLE.TWO_YEARS));

        expect(sentData().at(-2)).toMatchObject({ Cycle: CYCLE.TWO_YEARS, VatId: 'DE123456789' });
        expect(sentData().at(-1)).toMatchObject({ Cycle: CYCLE.TWO_YEARS });
        expect(sentData().at(-1)).not.toHaveProperty('VatId');
        expect(getContext().selectedPlan.cycle).toBe(CYCLE.TWO_YEARS);
        expect(getContext().vatNumber).not.toBe('DE123456789');
        expect(getContext().loading).toBe(false);

        // The refused VAT number isn't sent again with the next change either
        await act(() => getContext().selectCycle(CYCLE.YEARLY));
        expect(sentData().at(-1)).not.toHaveProperty('VatId');
    });
});
