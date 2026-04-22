import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import {
    CYCLE,
    PAYMENT_METHOD_TYPES,
    PLANS,
    SubscriptionMode,
    getIsPlanTransitionForbidden,
    isSubscriptionCheckForbiddenWithReason,
} from '@proton/payments';
import { ProrationMode } from '@proton/payments/core/api/api';
import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments/core/billing-address/billing-address';
import { VatReverseChargeNotSupportedError } from '@proton/payments/core/errors';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/testing/builders';

import type { Model } from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from './constants';
import { getAllowedCycles } from './helpers/getAllowedCycles';
import {
    type UseSubscriptionContainerInnerCheckProps,
    useSubscriptionContainerInnerCheck,
} from './useSubscriptionContainerInnerCheck';

const mockCreateNotification = jest.fn();
jest.mock('../../../hooks/useNotifications', () => ({
    __esModule: true,
    default: () => ({ createNotification: mockCreateNotification }),
}));

jest.mock('@proton/payments', () => ({
    ...jest.requireActual('@proton/payments'),
    getIsPlanTransitionForbidden: jest.fn(),
    isSubscriptionCheckForbiddenWithReason: jest.fn(),
}));

jest.mock('./helpers/getAllowedCycles', () => ({
    getAllowedCycles: jest.fn(),
}));

function buildModel(overrides: Partial<Model> = {}): Model {
    return {
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        planIDs: { [PLANS.MAIL]: 1 },
        currency: 'EUR',
        cycle: CYCLE.MONTHLY,
        initialCheckComplete: false,
        taxBillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
        paymentForbiddenReason: { forbidden: false },
        ...overrides,
    };
}

function buildCheckResult(overrides: Partial<SubscriptionEstimation> = {}): SubscriptionEstimation {
    return {
        Amount: 499,
        AmountDue: 499,
        Currency: 'EUR',
        Cycle: CYCLE.MONTHLY,
        PeriodEnd: 0,
        Coupon: null,
        Gift: 0,
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
        requestData: { Plans: { [PLANS.MAIL]: 1 }, Currency: 'EUR', Cycle: CYCLE.MONTHLY },
        ...overrides,
    } as SubscriptionEstimation;
}

function buildDeps(
    overrides: Partial<UseSubscriptionContainerInnerCheckProps> = {}
): UseSubscriptionContainerInnerCheckProps {
    return {
        model: buildModel(),
        checkResult: buildCheckResult(),
        subscriptionCouponCode: undefined,
        subscription: buildSubscription(),
        paymentsApi: {
            checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
        } as any,
        paymentFacadeSelectedMethodType: undefined,
        skipPlanTransitionChecks: true,
        refs: {
            plansMapRef: { current: {} as any },
            giftCodeRef: { current: null },
        },
        setters: {
            setCheckResult: jest.fn(),
            setModel: jest.fn(),
            setVatReverseChargeErrorModal: jest.fn(),
        },
        callbacks: {
            runAdditionalChecks: jest.fn().mockResolvedValue(undefined),
            shouldPassIsTrial: jest.fn().mockReturnValue(false),
            reportPlanIDsIfChanged: jest.fn(),
            onPlusToPlusTransition: jest.fn(),
            onVisionaryDowngradeWarning: jest.fn().mockResolvedValue(undefined),
            onVisionaryDowngradeHide: jest.fn(),
            onCheck: jest.fn(),
        },
        ...overrides,
    };
}

describe('useSubscriptionCheck', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(isSubscriptionCheckForbiddenWithReason).mockReturnValue({ forbidden: false });
        jest.mocked(getIsPlanTransitionForbidden).mockReturnValue(null);
        jest.mocked(getAllowedCycles).mockReturnValue([CYCLE.MONTHLY, CYCLE.YEARLY]);
        mockCreateNotification.mockClear();
    });

    describe('free plan (no planIDs)', () => {
        it('sets free check result and updates model without calling API', async () => {
            const deps = buildDeps({ model: buildModel({ planIDs: {} }) });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel({ planIDs: {} }));

            expect(deps.paymentsApi.checkSubscription).not.toHaveBeenCalled();
            expect(deps.setters.setCheckResult).toHaveBeenCalledWith(expect.objectContaining({ AmountDue: 0 }));
            expect(deps.setters.setModel).toHaveBeenCalled();
        });
    });

    describe('PLAN_SELECTION step', () => {
        it('sets optimistic check result without calling API', async () => {
            const model = buildModel({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
            const deps = buildDeps({ model });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(model);

            expect(deps.paymentsApi.checkSubscription).not.toHaveBeenCalled();
            expect(deps.setters.setCheckResult).toHaveBeenCalled();
            expect(deps.setters.setModel).toHaveBeenCalled();
        });
    });

    describe('forbidden plan', () => {
        it('sets optimistic result with AmountDue 0 and paymentForbiddenReason without calling API', async () => {
            jest.mocked(isSubscriptionCheckForbiddenWithReason).mockReturnValueOnce({
                forbidden: true,
                reason: 'already-subscribed',
            });

            const deps = buildDeps();
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.paymentsApi.checkSubscription).not.toHaveBeenCalled();
            expect(deps.setters.setCheckResult).toHaveBeenCalledWith(expect.objectContaining({ AmountDue: 0 }));
            expect(deps.setters.setModel).toHaveBeenCalledWith(
                expect.objectContaining({ paymentForbiddenReason: { forbidden: true, reason: 'already-subscribed' } })
            );
        });
    });

    describe('happy path', () => {
        it('calls checkSubscription and updates state on success', async () => {
            const apiResult = buildCheckResult({
                Coupon: { Code: 'PROMO10', Description: 'Promo', MaximumRedemptionsPerUser: null },
                AmountDue: 400,
            });
            const deps = buildDeps({
                paymentsApi: { checkSubscription: jest.fn().mockResolvedValue(apiResult) } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.setters.setCheckResult).toHaveBeenCalledWith(apiResult);
            expect(deps.setters.setModel).toHaveBeenCalled();
            expect(deps.callbacks.onCheck).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success', result: apiResult })
            );
        });

        it('remembers the last valid coupon code for subsequent checks', async () => {
            const firstResult = buildCheckResult({
                Coupon: { Code: 'SAVE20', Description: '', MaximumRedemptionsPerUser: null },
            });
            const secondResult = buildCheckResult({ Coupon: null });
            const checkSubscription = jest.fn().mockResolvedValueOnce(firstResult).mockResolvedValueOnce(secondResult);
            const deps = buildDeps({
                paymentsApi: { checkSubscription } as any,
                subscriptionCouponCode: undefined,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel()); // seeds the internal ref with SAVE20
            await result.current.check(buildModel());

            const calledModel = (deps.setters.setModel as jest.Mock).mock.calls[1][0] as Model;
            expect(calledModel.coupon).toBe('SAVE20');
        });

        it('preserves gift on model when Gift > 0', async () => {
            const apiResult = buildCheckResult({ Gift: 100, Coupon: null });
            const deps = buildDeps({
                paymentsApi: { checkSubscription: jest.fn().mockResolvedValue(apiResult) } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel({ gift: 'GIFTCODE' }));

            const calledModel = (deps.setters.setModel as jest.Mock).mock.calls[0][0] as Model;
            expect(calledModel.gift).toBe('GIFTCODE');
        });

        it('removes gift from model when Gift is 0', async () => {
            const apiResult = buildCheckResult({ Gift: 0, Coupon: null });
            const deps = buildDeps({
                paymentsApi: { checkSubscription: jest.fn().mockResolvedValue(apiResult) } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel({ gift: 'GIFTCODE' }));

            const calledModel = (deps.setters.setModel as jest.Mock).mock.calls[0][0] as Model;
            expect(calledModel.gift).toBeUndefined();
        });

        describe('coupon cascade', () => {
            it('uses returned Code when present', async () => {
                const apiResult = buildCheckResult({
                    Coupon: { Code: 'FROMAPI', Description: '', MaximumRedemptionsPerUser: null },
                });
                const deps = buildDeps({
                    paymentsApi: { checkSubscription: jest.fn().mockResolvedValue(apiResult) } as any,
                });
                const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

                await result.current.check(buildModel());

                const calledModel = (deps.setters.setModel as jest.Mock).mock.calls[0][0] as Model;
                expect(calledModel.coupon).toBe('FROMAPI');
            });

            it('falls back to subscriptionCouponCode when Code is empty', async () => {
                const apiResult = buildCheckResult({ Coupon: null });
                const deps = buildDeps({
                    paymentsApi: { checkSubscription: jest.fn().mockResolvedValue(apiResult) } as any,
                    subscriptionCouponCode: 'SUB_COUPON',
                });
                const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

                await result.current.check(buildModel());

                const calledModel = (deps.setters.setModel as jest.Mock).mock.calls[0][0] as Model;
                expect(calledModel.coupon).toBe('SUB_COUPON');
            });

            it('falls back to latestValidCouponCode when Code and subscriptionCouponCode are both empty', async () => {
                const firstResult = buildCheckResult({
                    Coupon: { Code: 'PREV_VALID', Description: '', MaximumRedemptionsPerUser: null },
                });
                const secondResult = buildCheckResult({ Coupon: null });
                const checkSubscription = jest
                    .fn()
                    .mockResolvedValueOnce(firstResult)
                    .mockResolvedValueOnce(secondResult);
                const deps = buildDeps({
                    paymentsApi: { checkSubscription } as any,
                    subscriptionCouponCode: undefined,
                });
                const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

                await result.current.check(buildModel()); // seeds ref with PREV_VALID
                await result.current.check(buildModel());

                const calledModel = (deps.setters.setModel as jest.Mock).mock.calls[1][0] as Model;
                expect(calledModel.coupon).toBe('PREV_VALID');
            });
        });
    });

    describe('PAY-1822 coupon deduplication', () => {
        it('sends only subscriptionCouponCode in Codes when gift matches subscriptionCouponCode', async () => {
            const deps = buildDeps({
                subscriptionCouponCode: 'ACTIVE_COUPON',
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
                } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel({ gift: 'ACTIVE_COUPON' }));

            const payload = (deps.paymentsApi.checkSubscription as jest.Mock).mock.calls[0][0];
            // Only the subscription coupon code — no gift code alongside it
            expect(payload.Codes).toEqual(['ACTIVE_COUPON']);
        });

        it('sends both gift and auto-coupon when gift differs from subscriptionCouponCode', async () => {
            const deps = buildDeps({
                subscriptionCouponCode: 'SUB_COUPON',
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
                } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel({ gift: 'DIFFERENT_CODE' }));

            const payload = (deps.paymentsApi.checkSubscription as jest.Mock).mock.calls[0][0];
            expect(payload.Codes).toContain('DIFFERENT_CODE');
        });
    });

    describe('ProrationMode', () => {
        it('sets ProrationMode.Exact when selectedMethod is SEPA', async () => {
            const deps = buildDeps({
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
                } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel(), false, PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);

            const payload = (deps.paymentsApi.checkSubscription as jest.Mock).mock.calls[0][0];
            expect(payload.ProrationMode).toBe(ProrationMode.Exact);
        });

        it('sets ProrationMode.Exact when only paymentFacadeSelectedMethodType is SEPA', async () => {
            const deps = buildDeps({
                paymentFacadeSelectedMethodType: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
                } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel(), false, undefined);

            const payload = (deps.paymentsApi.checkSubscription as jest.Mock).mock.calls[0][0];
            expect(payload.ProrationMode).toBe(ProrationMode.Exact);
        });

        it('does not set ProrationMode for non-SEPA method', async () => {
            const deps = buildDeps({
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
                } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel(), false, PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);

            const payload = (deps.paymentsApi.checkSubscription as jest.Mock).mock.calls[0][0];
            expect(payload.ProrationMode).toBeUndefined();
        });
    });

    describe('invalid gift code', () => {
        it('shows error notification, focuses gift input, and returns previous checkResult without updating state', async () => {
            const focusMock = jest.fn();
            const previousCheckResult = buildCheckResult({ AmountDue: 999 });
            const deps = buildDeps({
                checkResult: previousCheckResult,
                refs: { plansMapRef: { current: {} as any }, giftCodeRef: { current: { focus: focusMock } } },
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult({ Gift: 0, Coupon: null })),
                } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            const returnVal = await result.current.check(buildModel({ gift: 'WRONGCODE' }), true);

            expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
            expect(focusMock).toHaveBeenCalledTimes(1);
            expect(deps.setters.setCheckResult).not.toHaveBeenCalled();
            expect(deps.setters.setModel).not.toHaveBeenCalled();
            expect(returnVal).toBe(previousCheckResult);
        });

        it('skips gift code validation when wantToApplyNewGiftCode is false', async () => {
            const deps = buildDeps({
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult({ Gift: 0, Coupon: null })),
                } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            // wantToApplyNewGiftCode = false → no notification, state is updated normally
            await result.current.check(buildModel({ gift: 'WRONGCODE' }), false);

            expect(mockCreateNotification).not.toHaveBeenCalled();
            expect(deps.setters.setCheckResult).toHaveBeenCalled();
        });
    });

    describe('abort controller', () => {
        it('aborts the previous in-flight request when called again', async () => {
            const abortSpy = jest.fn();
            const OriginalAbortController = AbortController;
            (global as any).AbortController = class {
                abort = abortSpy;
                signal = new OriginalAbortController().signal;
            };

            try {
                const deps = buildDeps({
                    paymentsApi: {
                        checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
                    } as any,
                });
                const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

                await result.current.check(buildModel());
                await result.current.check(buildModel());

                expect(abortSpy).toHaveBeenCalledTimes(1);
            } finally {
                (global as any).AbortController = OriginalAbortController;
            }
        });
    });

    describe('normalizeModel', () => {
        const withoutPlanTransitionChecks = (overrides: Partial<UseSubscriptionContainerInnerCheckProps> = {}) =>
            buildDeps({ skipPlanTransitionChecks: false, ...overrides });

        it('calls onPlusToPlusTransition with the plan from plansMap on plus-to-plus transition', async () => {
            const unlockPlan = { ID: 'plan123', Name: 'mail2022' } as any;
            jest.mocked(getIsPlanTransitionForbidden).mockReturnValueOnce({
                type: 'plus-to-plus',
                newPlanName: 'mail2022',
            } as any);

            const deps = withoutPlanTransitionChecks({
                refs: {
                    plansMapRef: { current: { mail2022: unlockPlan } as any },
                    giftCodeRef: { current: null },
                },
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.callbacks.onPlusToPlusTransition).toHaveBeenCalledWith(unlockPlan);
        });

        it('updates planIDs to newPlanIDs on lumo-plus transition', async () => {
            const newPlanIDs = { lumo: 1 };
            jest.mocked(getIsPlanTransitionForbidden).mockReturnValueOnce({
                type: 'lumo-plus',
                newPlanIDs,
            } as any);

            const deps = withoutPlanTransitionChecks();
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            const calledModel = (deps.setters.setModel as jest.Mock).mock.calls[0][0] as Model;
            expect(calledModel.planIDs).toMatchObject(newPlanIDs);
        });

        it('calls onVisionaryDowngradeHide for non-visionary transitions', async () => {
            jest.mocked(getIsPlanTransitionForbidden).mockReturnValueOnce(null);

            const deps = withoutPlanTransitionChecks();
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.callbacks.onVisionaryDowngradeHide).toHaveBeenCalled();
        });

        it('proceeds normally when visionary downgrade is confirmed', async () => {
            jest.mocked(getIsPlanTransitionForbidden).mockReturnValueOnce({ type: 'visionary-downgrade' } as any);

            const deps = withoutPlanTransitionChecks();
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.callbacks.onVisionaryDowngradeWarning).toHaveBeenCalled();
            expect(deps.paymentsApi.checkSubscription).toHaveBeenCalled();
        });

        it('returns undefined and skips state updates when visionary downgrade is cancelled', async () => {
            jest.mocked(getIsPlanTransitionForbidden).mockReturnValueOnce({ type: 'visionary-downgrade' } as any);

            const deps = withoutPlanTransitionChecks({
                callbacks: {
                    runAdditionalChecks: jest.fn().mockResolvedValue(undefined),
                    shouldPassIsTrial: jest.fn().mockReturnValue(false),
                    reportPlanIDsIfChanged: jest.fn(),
                    onPlusToPlusTransition: jest.fn(),
                    onVisionaryDowngradeWarning: jest.fn().mockRejectedValue(new Error('cancelled')),
                    onVisionaryDowngradeHide: jest.fn(),
                },
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            const returnVal = await result.current.check(buildModel());

            expect(returnVal).toBeUndefined();
            expect(deps.paymentsApi.checkSubscription).not.toHaveBeenCalled();
            expect(deps.setters.setCheckResult).not.toHaveBeenCalled();
            expect(deps.setters.setModel).not.toHaveBeenCalled();
        });

        it('skips getIsPlanTransitionForbidden when skipPlanTransitionChecks is true', async () => {
            const deps = buildDeps({ skipPlanTransitionChecks: true });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(getIsPlanTransitionForbidden).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('returns undefined silently on AbortError without touching state', async () => {
            const abortError = new Error('aborted');
            abortError.name = 'AbortError';
            const deps = buildDeps({
                paymentsApi: { checkSubscription: jest.fn().mockRejectedValue(abortError) } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.setters.setCheckResult).not.toHaveBeenCalled();
            expect(deps.setters.setModel).not.toHaveBeenCalled();
            expect(deps.callbacks.onCheck).not.toHaveBeenCalled();
        });

        it('calls setModel with NETWORK_ERROR step on OfflineError', async () => {
            const offlineError = new Error('offline');
            offlineError.name = 'OfflineError';
            const deps = buildDeps({
                paymentsApi: { checkSubscription: jest.fn().mockRejectedValue(offlineError) } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.setters.setModel).toHaveBeenCalledWith(
                expect.objectContaining({ step: SUBSCRIPTION_STEPS.NETWORK_ERROR })
            );
        });

        it('opens VAT modal and does not call onCheck on VatReverseChargeNotSupportedError', async () => {
            const vatError = new VatReverseChargeNotSupportedError();
            const deps = buildDeps({
                paymentsApi: { checkSubscription: jest.fn().mockRejectedValue(vatError) } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.setters.setVatReverseChargeErrorModal).toHaveBeenCalledWith(true);
            expect(deps.callbacks.onCheck).not.toHaveBeenCalled();
        });

        it('calls onCheck with type error for unknown errors', async () => {
            const unknownError = new Error('something went wrong');
            const deps = buildDeps({
                paymentsApi: { checkSubscription: jest.fn().mockRejectedValue(unknownError) } as any,
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.callbacks.onCheck).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'error', error: unknownError })
            );
        });

        it('still commits state even if runAdditionalChecks throws', async () => {
            const deps = buildDeps({
                paymentsApi: {
                    checkSubscription: jest.fn().mockResolvedValue(buildCheckResult()),
                } as any,
                callbacks: {
                    runAdditionalChecks: jest.fn().mockRejectedValue(new Error('additional check failed')),
                    shouldPassIsTrial: jest.fn().mockReturnValue(false),
                    reportPlanIDsIfChanged: jest.fn(),
                    onPlusToPlusTransition: jest.fn(),
                    onVisionaryDowngradeWarning: jest.fn().mockResolvedValue(undefined),
                    onVisionaryDowngradeHide: jest.fn(),
                },
            });
            const { result } = componentsHookRenderer(() => useSubscriptionContainerInnerCheck(deps));

            await result.current.check(buildModel());

            expect(deps.setters.setCheckResult).toHaveBeenCalled();
            expect(deps.setters.setModel).toHaveBeenCalled();
        });
    });
});
