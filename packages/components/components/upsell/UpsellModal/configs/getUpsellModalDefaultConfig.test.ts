import { CYCLE, type Currency, PLANS, PLAN_TYPES, type PaymentsApi, type Plan } from '@proton/payments';
import * as checkoutModule from '@proton/shared/lib/helpers/checkout';

import type { UpsellModalConfigParams } from '../interface';
import { getUpsellModalDefaultConfig } from './getUpsellModalDefaultConfig';

jest.mock('@proton/shared/lib/helpers/checkout');
jest.mock('@proton/payments/core/subscription/selected-plan', () => ({
    SelectedPlan: { createFromSubscription: jest.fn() },
}));

// @ts-expect-error - mock of paymentApi call
let paymentsApiMock: PaymentsApi = {
    checkWithAutomaticVersion: jest.fn(),
};

const MOCK_YEARLY_PRICE_BRL = 120;
const MOCK_YEARLY_PRICE_USD = 100;

async function setupTest(currency: Currency) {
    // @ts-expect-error - mock of paymentApi call
    paymentsApiMock.checkWithAutomaticVersion.mockResolvedValue({
        AmountDue: MOCK_YEARLY_PRICE_BRL,
    });
    // @ts-expect-error - mock of checkout call
    jest.spyOn(checkoutModule, 'getCheckout').mockReturnValue({
        withDiscountPerCycle: MOCK_YEARLY_PRICE_BRL,
    });

    const config = await getUpsellModalDefaultConfig({
        currency,
        paymentsApi: paymentsApiMock,
        plans: [
            {
                ID: PLANS.BUNDLE,
                Type: PLAN_TYPES.PLAN,
                Name: PLANS.BUNDLE,
                Currency: 'USD',
                Amount: 10,
                Pricing: {
                    [CYCLE.MONTHLY]: 10,
                    [CYCLE.YEARLY]: MOCK_YEARLY_PRICE_USD,
                    [CYCLE.TWO_YEARS]: 150,
                },
            } as unknown as Plan,
        ],
    } as UpsellModalConfigParams);

    return {
        config,
    };
}

describe('getUpsellModalDefaultConfig', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('When main currency it should return correct config', async () => {
        const { config } = await setupTest('USD');

        // Should not be called because it's a main currency
        // and we don't need to fetch the price because it's already in the plan
        expect(paymentsApiMock.checkWithAutomaticVersion).toHaveBeenCalledTimes(0);

        expect(config).toHaveProperty('planIDs', { [PLANS.BUNDLE]: 1 });
        expect(config).toHaveProperty('cycle', CYCLE.YEARLY);

        expect(config.submitText).toBe('Get Proton Unlimited');

        const footerText = config.footerText as any;
        expect(footerText).not.toBeNull();
        expect(footerText[0]).toBe('Unlock all ');
        expect(footerText[2]).toBe(' premium products and features for just ');
        expect(footerText[3].props.currency).toBe('USD');
        expect(footerText[3].props.children).toBe(MOCK_YEARLY_PRICE_USD / 12);
    });

    it('When non main currency it should return correct config', async () => {
        const { config } = await setupTest('BRL');

        // Should be called because it's not a main currency and we need to fetch the price in this case
        // because the plan doesn't have the price in BRL
        expect(paymentsApiMock.checkWithAutomaticVersion).toHaveBeenCalledTimes(1);

        expect(config).toHaveProperty('planIDs', { [PLANS.BUNDLE]: 1 });
        expect(config).toHaveProperty('cycle', CYCLE.YEARLY);

        expect(config.submitText).toBe('Get Proton Unlimited');

        const footerText = config.footerText as any;
        expect(footerText).not.toBeNull();
        expect(footerText[0]).toBe('Unlock all ');
        expect(footerText[2]).toBe(' premium products and features for just ');
        expect(footerText[3].props.currency).toBe('BRL');
        expect(footerText[3].props.children).toBe(MOCK_YEARLY_PRICE_BRL / 12);
    });
});
