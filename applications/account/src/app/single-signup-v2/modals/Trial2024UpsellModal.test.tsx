import { renderHook } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { getStoreWrapper } from '@proton/components/testing/renderWithProviders';
import { usePaymentsApi } from '@proton/payments-ui/react-extensions/usePaymentsApi';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { buildUser } from '@proton/shared/testing/buildUser';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { checkTrialPrice } from './Trial2024UpsellModal';

const checkUrl = 'payments/v5/subscription/check';

const getCheckCalls = () => apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === checkUrl);

const getPaymentsApi = () => {
    const { Wrapper } = getStoreWrapper({
        preloadedState: {
            user: getModelState(buildUser({ Currency: 'EUR' })),
            plans: getModelState({ plans: getTestPlans('EUR'), freePlan: FREE_PLAN }),
        },
    });
    return renderHook(() => usePaymentsApi(), { wrapper: Wrapper }).result.current.paymentsApi;
};

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
});

/**
 * Regression for P2-2728: pins the check request body and the returned prices of the trial upsell.
 */
describe('checkTrialPrice', () => {
    it.each([
        [PLANS.MAIL, COUPON_CODES.MAILPLUSINTRO],
        [PLANS.DRIVE, COUPON_CODES.TRYDRIVEPLUS2024],
        [PLANS.PASS, COUPON_CODES.PASSPLUSINTRO2024],
    ] as const)(
        'checks %s monthly with the %s intro coupon in Codes and returns the catalog price',
        async (planName, coupon) => {
            const plansMap = getPlansMap(getTestPlans('EUR'), 'EUR', false);
            const fullAmount = plansMap[planName]!.Pricing![CYCLE.MONTHLY]!;
            const checkResult = {
                Amount: fullAmount,
                AmountDue: 100,
                CouponDiscount: 100 - fullAmount,
                Coupon: { Code: coupon, Description: '' },
                Cycle: CYCLE.MONTHLY,
                Currency: 'EUR',
            };
            addApiMock(checkUrl, () => checkResult);

            const result = await checkTrialPrice({
                paymentsApi: getPaymentsApi(),
                currency: 'EUR',
                plansMap,
                planName,
            });

            expect(getCheckCalls()).toHaveLength(1);
            expect(getCheckCalls()[0].data).toEqual(
                expect.objectContaining({
                    Plans: { [planName]: 1 },
                    Currency: 'EUR',
                    Cycle: CYCLE.MONTHLY,
                    Codes: [coupon],
                })
            );
            expect(getCheckCalls()[0].data.CouponCode).toBeUndefined();
            expect(result).toEqual(
                expect.objectContaining({
                    fullAmount,
                    currency: 'EUR',
                    planData: { planIDs: { [planName]: 1 }, coupon, cycle: CYCLE.MONTHLY, currency: 'EUR' },
                    checkResult: expect.objectContaining({ AmountDue: 100, Amount: fullAmount }),
                })
            );
        }
    );

    it('rejects when the plan has no price for the cycle', async () => {
        addApiMock(checkUrl, () => ({
            Amount: 0,
            AmountDue: 0,
            CouponDiscount: 0,
            Cycle: CYCLE.MONTHLY,
            Currency: 'EUR',
        }));

        await expect(
            checkTrialPrice({ paymentsApi: getPaymentsApi(), currency: 'EUR', plansMap: {}, planName: PLANS.MAIL })
        ).rejects.toThrow('Plan mail2022-EUR-1m not found');
    });
});
