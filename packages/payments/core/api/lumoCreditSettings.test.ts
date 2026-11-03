import { updateLumoCreditAutoTopUpConfig } from './lumoCredit';

describe('Lumo credit settings request configs', () => {
    it('updates the automatic top-up and its spending limit without a raw error notification', () => {
        expect(
            updateLumoCreditAutoTopUpConfig({
                Enabled: true,
                Quantity: 50,
                SpendingLimitEnabled: true,
                SpendingLimit: 250,
            })
        ).toEqual({
            url: 'payments/v5/products/lumo-credit/auto-top-up',
            method: 'put',
            data: { Enabled: true, Quantity: 50, SpendingLimitEnabled: true, SpendingLimit: 250 },
            silence: true,
        });
    });
});
