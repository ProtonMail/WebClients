import { renderHook, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { getStoreWrapper } from '../../../../../testing/renderWithProviders';
import { useCancellationOffer } from './useCancellationOffer';

const checkUrl = 'payments/v5/subscription/check';

const getCheckCalls = () => apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === checkUrl);

const getWrapper = (cycle: CYCLE) =>
    getStoreWrapper({
        preloadedState: {
            user: getModelState(buildUser({ Currency: 'EUR' })),
            plans: getModelState({ plans: getTestPlans('EUR'), freePlan: FREE_PLAN }),
            subscription: getSubscriptionState(buildSubscription({ planName: PLANS.MAIL, cycle, currency: 'EUR' })),
        },
    }).Wrapper;

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
    addApiMock('core/v4/features', () => ({
        Features: [{ Code: FeatureCode.CanUseFeedbackFirstCancellationOffer, Value: true }],
    }));
});

/**
 * Regression for P2-2728: the cancellation offer price comes from one of the checkSubscription -> getCheckoutUi copies
 * that is going to be replaced by a shared fetchCheckoutPrice. Pins the check request and the returned checkout.
 */
describe('useCancellationOffer', () => {
    it.each([
        [CYCLE.YEARLY, COUPON_CODES.RENEWANDSAVE12M26],
        [CYCLE.MONTHLY, COUPON_CODES.RENEWANDSAVE1M26],
    ])('checks the current plan for cycle %s with %s in the subscription currency', async (cycle, coupon) => {
        const amount = getTestPlans('EUR').find((plan) => plan.Name === PLANS.MAIL)!.Pricing[cycle]!;
        addApiMock(checkUrl, () => ({
            Amount: amount,
            AmountDue: amount / 2,
            CouponDiscount: -amount / 2,
            Coupon: { Code: coupon, Description: '' },
            Cycle: cycle,
            Currency: 'EUR',
        }));

        const { result } = renderHook(() => useCancellationOffer(), { wrapper: getWrapper(cycle) });

        await waitFor(() => expect(result.current.offerIsAvailable).toBe(true));
        expect(getCheckCalls()).toHaveLength(1);
        expect(getCheckCalls()[0].data).toEqual(
            expect.objectContaining({ Plans: { [PLANS.MAIL]: 1 }, Currency: 'EUR', Cycle: cycle, CouponCode: coupon })
        );
        expect(result.current.checkout?.withDiscountPerCycle).toBe(amount / 2);
        expect(result.current.yearlyRenewalPrice).toBe(4788);
        expect(result.current).toEqual(
            expect.objectContaining({ planName: PLANS.MAIL, cycle, currency: 'EUR', coupon })
        );
    });

    it('falls back to the optimistic price without the coupon discount when the check fails', async () => {
        addApiMock(checkUrl, () => Promise.reject(new Error('check failed')));

        const { result } = renderHook(() => useCancellationOffer(), { wrapper: getWrapper(CYCLE.YEARLY) });

        await waitFor(() => expect(result.current.offerIsAvailable).toBe(true));
        expect(getCheckCalls()).toHaveLength(1);
        expect(result.current.checkout?.withDiscountPerCycle).toBe(4788);
    });
});
