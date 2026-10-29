import { getLumoCreditConfig } from './lumoCredit';

describe('getLumoCreditConfig', () => {
    it('reads the Lumo credit balance from the products endpoint', () => {
        expect(getLumoCreditConfig()).toEqual({ url: 'payments/v5/products/lumo-credit', method: 'get' });
    });
});
