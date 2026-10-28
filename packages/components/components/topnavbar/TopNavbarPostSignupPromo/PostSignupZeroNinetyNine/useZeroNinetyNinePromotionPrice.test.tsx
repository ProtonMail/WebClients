import { renderHook, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { getStoreWrapper } from '../../../../testing/renderWithProviders';
import { useZeroNinetyNinePromotionPrice } from './useZeroNinetyNinePromotionPrice';

const checkUrl = 'payments/v5/subscription/check';

const getCheckCalls = () => apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === checkUrl);

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
});

/**
 * Regression for P2-2728: the 0.99 promotion price comes from one of the checkSubscription -> getCheckoutUi copies that
 * is going to be replaced by a shared fetchCheckoutPrice. Pins the check request and the returned amount.
 */
describe('useZeroNinetyNinePromotionPrice', () => {
    it('checks Mail Plus monthly with TRYMAILPLUS0926 in the user currency and returns the discounted amount', async () => {
        addApiMock(checkUrl, () => ({
            Amount: 499,
            AmountDue: 99,
            CouponDiscount: -400,
            Coupon: { Code: COUPON_CODES.TRYMAILPLUS0926, Description: '' },
            Cycle: CYCLE.MONTHLY,
            Currency: 'EUR',
        }));
        const { Wrapper } = getStoreWrapper({
            preloadedState: {
                user: getModelState(buildUser({ Currency: 'EUR' })),
                plans: getModelState({ plans: getTestPlans('EUR'), freePlan: FREE_PLAN }),
            },
        });

        const { result } = renderHook(() => useZeroNinetyNinePromotionPrice({}), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.hasPrice).toBe(true));
        expect(result.current.amountDue).toBe(99);
        expect(getCheckCalls()).toHaveLength(1);
        expect(getCheckCalls()[0].data).toEqual(
            expect.objectContaining({
                Plans: { [PLANS.MAIL]: 1 },
                Currency: 'EUR',
                Cycle: CYCLE.MONTHLY,
                CouponCode: COUPON_CODES.TRYMAILPLUS0926,
            })
        );
    });
});
