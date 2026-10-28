import { renderHook, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { getStoreWrapper } from '../../../../../testing/renderWithProviders';
import { usePostSignupOneDollarPromotionPrice } from './usePostSignupOneDollarPromotionPrice';

const checkUrl = 'payments/v5/subscription/check';

const getCheckCalls = () => apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === checkUrl);

const getWrapper = (currency: 'EUR' | 'BRL') =>
    getStoreWrapper({
        preloadedState: {
            user: getModelState(buildUser({ Currency: currency })),
            plans: getModelState({ plans: getTestPlans(currency), freePlan: FREE_PLAN }),
        },
    }).Wrapper;

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
});

/**
 * Regression for P2-2728: the one dollar promotion price goes through useRegionalPricing.fetchPrice, which is going to
 * reuse the shared fetchCheckoutPrice. Pins the main currency short-circuit and the regional check request.
 */
describe('usePostSignupOneDollarPromotionPrice', () => {
    it('returns one dollar without checking for main currencies', async () => {
        const { result } = renderHook(() => usePostSignupOneDollarPromotionPrice({ offerProduct: 'mail' }), {
            wrapper: getWrapper('EUR'),
        });

        await waitFor(() => expect(result.current.amountDue).toBe(100));
        expect(getCheckCalls()).toHaveLength(0);
    });

    it.each([
        ['mail', PLANS.MAIL, COUPON_CODES.TRYMAILPLUS0724],
        ['drive', PLANS.DRIVE, COUPON_CODES.TRYDRIVEPLUS2024],
    ] as const)('checks the %s offer monthly in the regional currency', async (offerProduct, plan, coupon) => {
        addApiMock(checkUrl, () => ({
            Amount: 2500,
            AmountDue: 500,
            CouponDiscount: -2000,
            Coupon: { Code: coupon, Description: '' },
            Cycle: CYCLE.MONTHLY,
            Currency: 'BRL',
        }));

        const { result } = renderHook(() => usePostSignupOneDollarPromotionPrice({ offerProduct }), {
            wrapper: getWrapper('BRL'),
        });

        await waitFor(() => expect(result.current.amountDue).toBe(500));
        expect(getCheckCalls()).toHaveLength(1);
        expect(getCheckCalls()[0].data).toEqual(
            expect.objectContaining({ Plans: { [plan]: 1 }, Currency: 'BRL', Cycle: CYCLE.MONTHLY, CouponCode: coupon })
        );
    });
});
