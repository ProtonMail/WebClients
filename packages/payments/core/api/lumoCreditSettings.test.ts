import { updateLumoCreditAutoTopUpConfig, updateLumoCreditSpendingLimitConfig } from './lumoCredit';

describe('Lumo credit settings request configs', () => {
    it('updates the automatic top-up without a raw error notification', () => {
        expect(updateLumoCreditAutoTopUpConfig({ Enabled: true, Quantity: 50 })).toEqual({
            url: 'payments/v5/products/lumo-credit/auto-top-up',
            method: 'put',
            data: { Enabled: true, Quantity: 50 },
            silence: true,
        });
    });

    it('updates the monthly spending limit without a raw error notification', () => {
        expect(updateLumoCreditSpendingLimitConfig({ Enabled: true, Limit: 250 })).toEqual({
            url: 'payments/v5/products/lumo-credit/spending-limit',
            method: 'put',
            data: { Enabled: true, Limit: 250 },
            silence: true,
        });
    });
});
