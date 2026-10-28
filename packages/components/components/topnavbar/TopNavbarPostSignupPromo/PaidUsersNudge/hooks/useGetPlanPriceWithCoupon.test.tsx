import { renderHook, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { getStoreWrapper } from '../../../../../testing/renderWithProviders';
import { useGetPlanPriceWithCoupon } from './useGetPlanPriceWithCoupon';

const checkUrl = 'payments/v5/subscription/check';

const getCheckCalls = () => apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === checkUrl);

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
});

/**
 * Regression for P2-2728: the yearly offer price is computed by one of the checkSubscription -> getCheckoutUi copies
 * that is going to be replaced by a shared fetchCheckoutPrice. Pins the check request and the returned prices.
 */
describe('useGetPlanPriceWithCoupon', () => {
    it('checks the plan yearly with ANNUALOFFER25 in the user currency and returns the yearly prices', async () => {
        const mailYearly = getTestPlans('EUR').find((plan) => plan.Name === PLANS.MAIL)!.Pricing[CYCLE.YEARLY]!;
        addApiMock(checkUrl, () => ({
            Amount: mailYearly,
            AmountDue: mailYearly * 0.75,
            CouponDiscount: -mailYearly * 0.25,
            Coupon: { Code: COUPON_CODES.ANNUALOFFER25, Description: '' },
            Cycle: CYCLE.YEARLY,
            Currency: 'EUR',
        }));
        const { Wrapper } = getStoreWrapper({
            preloadedState: {
                user: getModelState(buildUser({ Currency: 'EUR' })),
                plans: getModelState({ plans: getTestPlans('EUR'), freePlan: FREE_PLAN }),
            },
        });

        const { result } = renderHook(() => useGetPlanPriceWithCoupon({ plan: PLANS.MAIL }), { wrapper: Wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(getCheckCalls()).toHaveLength(1);
        expect(getCheckCalls()[0].data).toEqual(
            expect.objectContaining({
                Plans: { [PLANS.MAIL]: 1 },
                Currency: 'EUR',
                Cycle: CYCLE.YEARLY,
                CouponCode: COUPON_CODES.ANNUALOFFER25,
            })
        );
        expect(result.current.prices).toEqual({
            yearlyPrice: 6000,
            discountedPrice: 3600,
            savedAmount: 2300,
            currency: 'EUR',
        });
    });
});
