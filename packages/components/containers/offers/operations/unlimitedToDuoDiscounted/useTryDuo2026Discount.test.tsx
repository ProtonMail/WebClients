import { renderHook, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { getStoreWrapper } from '../../../../testing/renderWithProviders';
import { useTryDuo2026Discount } from './useTryDuo2026Discount';

const checkUrl = 'payments/v5/subscription/check';

const getWrapper = () =>
    getStoreWrapper({
        preloadedState: {
            user: getModelState(buildUser({ Currency: 'EUR' })),
            plans: getModelState({ plans: getTestPlans('EUR'), freePlan: FREE_PLAN }),
        },
    }).Wrapper;

const getCheckCalls = () => apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === checkUrl);

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
});

/**
 * Regression for P2-2728: the price fetching copies (checkSubscription -> getPlansMap -> getCheckoutUi) are going to be
 * replaced by one shared fetchCheckoutPrice. The hook public output and the check request must stay the same.
 */
describe('useTryDuo2026Discount', () => {
    it('checks Duo yearly with the TRYDUO2026 coupon in the user currency and returns the discount percent', async () => {
        const duoYearly = getTestPlans('EUR').find((plan) => plan.Name === PLANS.DUO)!.Pricing[CYCLE.YEARLY]!;
        addApiMock(checkUrl, () => ({
            Amount: duoYearly,
            AmountDue: duoYearly / 2,
            CouponDiscount: -duoYearly / 2,
            Coupon: { Code: COUPON_CODES.TRYDUO2026, Description: '' },
            Cycle: CYCLE.YEARLY,
            Currency: 'EUR',
        }));

        const { result } = renderHook(() => useTryDuo2026Discount({ enabled: true }), { wrapper: getWrapper() });

        await waitFor(() => expect(result.current.discount).toBe(63)); // half the yearly price, measured against 12x the monthly price
        expect(getCheckCalls()).toHaveLength(1);
        expect(getCheckCalls()[0].data).toEqual(
            expect.objectContaining({
                Plans: { [PLANS.DUO]: 1 },
                Currency: 'EUR',
                Cycle: CYCLE.YEARLY,
                CouponCode: COUPON_CODES.TRYDUO2026,
            })
        );
        expect(result.current.loading).toBe(false);
    });

    it('returns no discount when the check fails', async () => {
        addApiMock(checkUrl, () => Promise.reject(new Error('check failed')));

        const { result } = renderHook(() => useTryDuo2026Discount({ enabled: true }), { wrapper: getWrapper() });

        await waitFor(() => expect(getCheckCalls()).toHaveLength(1));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.discount).toBeUndefined();
    });

    it('does not check the price when disabled', async () => {
        renderHook(() => useTryDuo2026Discount({ enabled: false }), { wrapper: getWrapper() });

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(getCheckCalls()).toHaveLength(0);
    });
});
