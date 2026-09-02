import * as checkoutModule from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Currency, PaymentsApi } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';

import type { UpsellModalConfigParams } from '../interface';
import { ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE, getUpsellModalFreeUserConfig } from './getUpsellModalFreeUserConfig';

jest.mock('@proton/payments/core/checkout');
jest.mock('@proton/payments/core/subscription/selected-plan', () => ({
    SelectedPlan: { createFromSubscription: jest.fn() },
}));

// @ts-expect-error - mock of paymentApi call
const paymentsApiMock: PaymentsApi = {
    checkSubscription: jest.fn(),
};

const NON_MAIN_CURRENCY_MOCK_AMOUNT = 12;
const NON_MAIN_CURRENCY_MOCK_AMOUNT_WITHOUT_DISCOUNT = 20;
const MAIN_CURRENCY_MONTHLY_MAIL_PLUS_AMOUNT = 8;

async function setupTest(currency: Currency, hasHadSubscription = false) {
    // @ts-expect-error - mock of paymentApi call
    paymentsApiMock.checkSubscription.mockResolvedValue({
        AmountDue: NON_MAIN_CURRENCY_MOCK_AMOUNT,
    });

    // @ts-expect-error - mock of checkout call
    jest.spyOn(checkoutModule, 'getCheckoutUi').mockReturnValue({
        withDiscountPerCycle: NON_MAIN_CURRENCY_MOCK_AMOUNT,
        withoutDiscountPerCycle: NON_MAIN_CURRENCY_MOCK_AMOUNT_WITHOUT_DISCOUNT,
    });

    const config = await getUpsellModalFreeUserConfig({
        currency,
        hasHadSubscription,
        paymentsApi: paymentsApiMock,
        plans: [
            {
                ID: PLANS.MAIL,
                Type: PLAN_TYPES.PLAN,
                Name: PLANS.MAIL,
                Currency: 'USD',
                Amount: 10,
                Pricing: {
                    [CYCLE.MONTHLY]: MAIN_CURRENCY_MONTHLY_MAIL_PLUS_AMOUNT,
                    [CYCLE.YEARLY]: 110,
                    [CYCLE.TWO_YEARS]: 150,
                },
            } as unknown as Plan,
        ],
    } as UpsellModalConfigParams);

    return {
        config,
    };
}

describe('getUpsellModalFreeUserConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('When main currency it should return correct config with $1 promo', async () => {
        const { config } = await setupTest('USD');

        // Should not be called because it's a main currency
        // and we use the default ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE
        expect(paymentsApiMock.checkSubscription).not.toHaveBeenCalled();

        expect(config).toHaveProperty('planIDs', { [PLANS.MAIL]: 1 });
        expect(config).toHaveProperty('cycle', CYCLE.MONTHLY);
        expect(config).toHaveProperty('coupon', COUPON_CODES.TRYMAILPLUS0724);

        const submitText = config.submitText as any;

        // Check submitText contains both prices (promo and regular)
        expect(submitText).not.toBeNull();
        expect(submitText[0]).toBe('Get ');
        expect(submitText[1]).toBe(PLAN_NAMES[PLANS.MAIL]);
        expect(submitText[2]).toBe(' for ');
        expect(submitText[3].props.children).toBe(ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE);

        const footerText = config.footerText as any;

        // Check footerText contains both prices (promo and regular)
        expect(footerText).not.toBeNull();
        expect(footerText[0]).toBe('The discounted price of ');
        expect(footerText[1].props.children).toBe(ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE);
        expect(footerText[2]).toBe(' is valid for the first month. Then it will automatically be renewed at ');
        expect(footerText[3].props.children).toBe(MAIN_CURRENCY_MONTHLY_MAIL_PLUS_AMOUNT);
    });

    it('When the user already had a subscription it should drop the promo coupon and show the regular price', async () => {
        const { config } = await setupTest('USD', true);

        expect(config).toHaveProperty('planIDs', { [PLANS.MAIL]: 1 });
        expect(config).toHaveProperty('cycle', CYCLE.MONTHLY);
        expect(config.coupon).toBeUndefined();

        const submitText = config.submitText as any;

        // The price offered must be the regular one, never the one-dollar promo amount
        expect(submitText[1]).toBe(PLAN_NAMES[PLANS.MAIL]);
        expect(submitText[3].props.children).toBe(MAIN_CURRENCY_MONTHLY_MAIL_PLUS_AMOUNT);
        expect(submitText[3].props.children).not.toBe(ONE_DOLLAR_PROMO_DEFAULT_AMOUNT_DUE);

        const footerText = config.footerText as any;

        // User shouldn't see the price per month repeated at the bottom
        expect(footerText).toBe(undefined);
    });

    it('When the user already had a subscription it should not send the coupon when fetching the price', async () => {
        await setupTest('BRL', true);

        expect(paymentsApiMock.checkSubscription).toHaveBeenCalledTimes(1);
        expect(paymentsApiMock.checkSubscription).toHaveBeenCalledWith(
            expect.objectContaining({ CouponCode: undefined })
        );
    });

    it('When non main currency it should return correct config with fetched price', async () => {
        const { config } = await setupTest('BRL');

        // Should be called because it's not a main currency
        // In this case we call it twice because we display a price with coupon
        // and a price without coupon.
        expect(paymentsApiMock.checkSubscription).toHaveBeenCalledTimes(1);

        expect(config).toHaveProperty('planIDs', { [PLANS.MAIL]: 1 });
        expect(config).toHaveProperty('cycle', CYCLE.MONTHLY);
        expect(config).toHaveProperty('coupon', 'TRYMAILPLUS0724');

        const submitText = config.submitText as any;

        // Check submit text contains the plan name and price
        expect(submitText).not.toBeNull();
        expect(submitText[0]).toBe('Get ');
        expect(submitText[1]).toBe(PLAN_NAMES[PLANS.MAIL]);
        expect(submitText[2]).toBe(' for ');
        expect(submitText[3].props.children).toBe(NON_MAIN_CURRENCY_MOCK_AMOUNT);

        const footerText = config.footerText as any;

        // Check footer text contains both prices (promo and regular)
        expect(footerText).not.toBeNull();
        expect(footerText[0]).toBe('The discounted price of ');
        expect(footerText[1].props.children).toBe(NON_MAIN_CURRENCY_MOCK_AMOUNT);
        expect(footerText[2]).toBe(' is valid for the first month. Then it will automatically be renewed at ');
        // The second pricing displayed in the footer text is the regular price, not the coupon price
        expect(footerText[3].props.children).toBe(NON_MAIN_CURRENCY_MOCK_AMOUNT_WITHOUT_DISCOUNT);
    });
});
