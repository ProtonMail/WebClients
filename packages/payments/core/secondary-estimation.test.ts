import type { CheckSubscriptionData } from './api/api';
import { ADDON_NAMES, ADDON_PREFIXES, CYCLE, PLANS } from './constants';
import type { PaymentsApi } from './interface';
import type { PlansMap } from './plan/interface';
import { runSecondarySubscriptionEstimation } from './secondary-estimation';
import type { SubscriptionEstimation } from './subscription/interface';

const plansMap = {
    [PLANS.BUNDLE]: { Pricing: { [CYCLE.YEARLY]: 11988 } },
    [ADDON_NAMES.LUMO_BUNDLE]: { Pricing: { [CYCLE.YEARLY]: 9588 } },
} as unknown as PlansMap;

const makePaymentsApi = (checkSubscription = jest.fn()): Pick<PaymentsApi, 'checkSubscription'> => ({
    checkSubscription,
});

const makePayload = (overrides: Partial<CheckSubscriptionData> = {}): CheckSubscriptionData => ({
    Plans: { [PLANS.BUNDLE]: 1 },
    Currency: 'EUR',
    Cycle: CYCLE.YEARLY,
    ...overrides,
});

describe('runSecondarySubscriptionEstimation', () => {
    it('returns null when the payload has no base plan', async () => {
        const paymentsApi = makePaymentsApi();

        const result = await runSecondarySubscriptionEstimation({
            checkPayload: makePayload({ Plans: {} }),
            plansMap,
            paymentsApi,
            addonPrefix: ADDON_PREFIXES.LUMO,
        });

        expect(result).toBeNull();
        expect(paymentsApi.checkSubscription).not.toHaveBeenCalled();
    });

    it('returns null when the addon family does not apply to the plan', async () => {
        const paymentsApi = makePaymentsApi();

        const result = await runSecondarySubscriptionEstimation({
            checkPayload: makePayload({ Plans: { [PLANS.FREE]: 1 } }),
            plansMap,
            paymentsApi,
            addonPrefix: ADDON_PREFIXES.LUMO,
        });

        expect(result).toBeNull();
        expect(paymentsApi.checkSubscription).not.toHaveBeenCalled();
    });

    describe('without coupon codes', () => {
        it('returns an optimistic estimation with the addon added, without hitting the API', async () => {
            const paymentsApi = makePaymentsApi();

            const result = await runSecondarySubscriptionEstimation({
                checkPayload: makePayload(),
                plansMap,
                paymentsApi,
                addonPrefix: ADDON_PREFIXES.LUMO,
            });

            expect(paymentsApi.checkSubscription).not.toHaveBeenCalled();
            expect(result).not.toBeNull();
            expect(result?.optimistic).toBe(true);
            expect(result?.CouponDiscount).toBe(0);
            expect(result?.Coupon).toBeNull();
            expect(result?.requestData.Plans).toEqual({ [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 });
            // Amount reflects the base plan plus one Lumo seat at the yearly rate.
            expect(result?.Amount).toBe(11988 + 9588);
        });

        it('adds `quantity` seats of the addon', async () => {
            const result = await runSecondarySubscriptionEstimation({
                checkPayload: makePayload(),
                plansMap,
                paymentsApi: makePaymentsApi(),
                addonPrefix: ADDON_PREFIXES.LUMO,
                quantity: 3,
            });

            expect(result?.requestData.Plans).toEqual({ [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 3 });
            expect(result?.Amount).toBe(11988 + 9588 * 3);
        });
    });

    describe('with coupon codes', () => {
        const estimation = { AmountDue: 17376 } as SubscriptionEstimation;

        it('checks the subscription with the addon added and returns the result', async () => {
            const checkSubscription = jest.fn().mockResolvedValue(estimation);
            const signal = new AbortController().signal;

            const result = await runSecondarySubscriptionEstimation({
                checkPayload: makePayload({ Codes: ['JUNE26BUNDLESALE'] }),
                plansMap,
                paymentsApi: makePaymentsApi(checkSubscription),
                addonPrefix: ADDON_PREFIXES.LUMO,
                signal,
            });

            expect(result).toBe(estimation);
            expect(checkSubscription).toHaveBeenCalledTimes(1);
            expect(checkSubscription).toHaveBeenCalledWith(
                {
                    Plans: { [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 },
                    Currency: 'EUR',
                    Cycle: CYCLE.YEARLY,
                    Codes: ['JUNE26BUNDLESALE'],
                },
                { signal }
            );
        });

        it('passes `quantity` seats and overrides an addon already in the payload', async () => {
            const checkSubscription = jest.fn().mockResolvedValue(estimation);

            await runSecondarySubscriptionEstimation({
                checkPayload: makePayload({
                    Plans: { [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 },
                    Codes: ['JUNE26BUNDLESALE'],
                }),
                plansMap,
                paymentsApi: makePaymentsApi(checkSubscription),
                addonPrefix: ADDON_PREFIXES.LUMO,
                quantity: 2,
            });

            expect(checkSubscription).toHaveBeenCalledWith(
                expect.objectContaining({ Plans: { [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 2 } }),
                { signal: undefined }
            );
        });

        it('returns null when the check fails', async () => {
            const checkSubscription = jest.fn().mockRejectedValue(new Error('network'));

            const result = await runSecondarySubscriptionEstimation({
                checkPayload: makePayload({ Codes: ['JUNE26BUNDLESALE'] }),
                plansMap,
                paymentsApi: makePaymentsApi(checkSubscription),
                addonPrefix: ADDON_PREFIXES.LUMO,
            });

            expect(result).toBeNull();
        });
    });
});
