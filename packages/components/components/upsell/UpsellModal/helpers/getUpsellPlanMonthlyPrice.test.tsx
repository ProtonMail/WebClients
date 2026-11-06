import { renderHook } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { usePaymentsApi } from '@proton/payments-hooks/react-extensions/usePaymentsApi';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { getStoreWrapper } from '../../../../testing/renderWithProviders';
import { getUpsellPlanMonthlyPrice } from './getUpsellPlanMonthlyPrice';

const checkUrl = 'payments/v5/subscription/check';

const getCheckCalls = () => apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === checkUrl);

const getMailPrice = (currency: Currency, cycle: CYCLE) =>
    getTestPlans(currency).find((plan) => plan.Name === PLANS.MAIL)!.Pricing[cycle]!;

const getPaymentsApi = (currency: Currency) => {
    const { Wrapper } = getStoreWrapper({
        preloadedState: {
            user: getModelState(buildUser({ Currency: currency })),
            plans: getModelState({ plans: getTestPlans(currency), freePlan: FREE_PLAN }),
        },
    });
    return renderHook(() => usePaymentsApi(), { wrapper: Wrapper }).result.current.paymentsApi;
};

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
});

/**
 * Regression for P2-2728: pins the main currency catalog price and the regional check of the upsell monthly price.
 */
describe('getUpsellPlanMonthlyPrice', () => {
    describe('main currency', () => {
        it.each([
            [CYCLE.MONTHLY, getMailPrice('EUR', CYCLE.MONTHLY)],
            [CYCLE.YEARLY, getMailPrice('EUR', CYCLE.YEARLY) / 12],
        ] as const)('returns the catalog monthly price for cycle %s without checking', async (cycle, expected) => {
            const result = await getUpsellPlanMonthlyPrice({
                currency: 'EUR',
                paymentsApi: getPaymentsApi('EUR'),
                plans: getTestPlans('EUR'),
                planIDs: { [PLANS.MAIL]: 1 },
                cycle,
            });

            expect(getCheckCalls()).toHaveLength(0);
            expect(result).toEqual({ couponPrice: expected, regularPrice: expected });
        });

        it('ignores the coupon and returns the catalog price without checking', async () => {
            const result = await getUpsellPlanMonthlyPrice({
                currency: 'EUR',
                paymentsApi: getPaymentsApi('EUR'),
                plans: getTestPlans('EUR'),
                planIDs: { [PLANS.MAIL]: 1 },
                cycle: CYCLE.MONTHLY,
                coupon: COUPON_CODES.TRYMAILPLUS0926,
            });

            expect(getCheckCalls()).toHaveLength(0);
            expect(result).toEqual({
                couponPrice: getMailPrice('EUR', CYCLE.MONTHLY),
                regularPrice: getMailPrice('EUR', CYCLE.MONTHLY),
            });
        });
    });

    describe('regional currency', () => {
        it('checks the plan with the coupon in the regional currency and returns the discounted and the regular price', async () => {
            const regularPrice = getMailPrice('BRL', CYCLE.MONTHLY);
            addApiMock(checkUrl, () => ({
                Amount: regularPrice,
                AmountDue: 500,
                CouponDiscount: 500 - regularPrice,
                Coupon: { Code: COUPON_CODES.TRYMAILPLUS0926, Description: '' },
                Cycle: CYCLE.MONTHLY,
                Currency: 'BRL',
            }));

            const result = await getUpsellPlanMonthlyPrice({
                currency: 'BRL',
                paymentsApi: getPaymentsApi('BRL'),
                plans: getTestPlans('BRL'),
                planIDs: { [PLANS.MAIL]: 1 },
                cycle: CYCLE.MONTHLY,
                coupon: COUPON_CODES.TRYMAILPLUS0926,
            });

            expect(getCheckCalls()).toHaveLength(1);
            expect(getCheckCalls()[0].data).toEqual(
                expect.objectContaining({
                    Plans: { [PLANS.MAIL]: 1 },
                    Currency: 'BRL',
                    Cycle: CYCLE.MONTHLY,
                    CouponCode: COUPON_CODES.TRYMAILPLUS0926,
                })
            );
            expect(result).toEqual({ couponPrice: 500, regularPrice });
        });

        it('returns the yearly check result as a monthly price, with the monthly catalog price as regular price', async () => {
            const regularPrice = getMailPrice('BRL', CYCLE.YEARLY);
            addApiMock(checkUrl, () => ({
                Amount: regularPrice,
                AmountDue: 6000,
                CouponDiscount: 6000 - regularPrice,
                Coupon: { Code: COUPON_CODES.TRYMAILPLUS0926, Description: '' },
                Cycle: CYCLE.YEARLY,
                Currency: 'BRL',
            }));

            const result = await getUpsellPlanMonthlyPrice({
                currency: 'BRL',
                paymentsApi: getPaymentsApi('BRL'),
                plans: getTestPlans('BRL'),
                planIDs: { [PLANS.MAIL]: 1 },
                cycle: CYCLE.YEARLY,
                coupon: COUPON_CODES.TRYMAILPLUS0926,
            });

            expect(result).toEqual({ couponPrice: 500, regularPrice: getMailPrice('BRL', CYCLE.MONTHLY) });
        });

        it('rejects when the check fails', async () => {
            addApiMock(checkUrl, () => Promise.reject(new Error('check failed')));

            await expect(
                getUpsellPlanMonthlyPrice({
                    currency: 'BRL',
                    paymentsApi: getPaymentsApi('BRL'),
                    plans: getTestPlans('BRL'),
                    planIDs: { [PLANS.MAIL]: 1 },
                    cycle: CYCLE.MONTHLY,
                })
            ).rejects.toThrow('check failed');
        });
    });
});
