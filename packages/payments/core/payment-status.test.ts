import { getDefaultState } from './countries';
import type { PaymentStatus } from './interface';
import { normalizePaymentMethodStatus } from './payment-status';

describe('normalizePaymentMethodStatus', () => {
    it('should keep and normalize VendorStates next to the billing address', () => {
        const status = {
            CountryCode: 'US',
            State: null,
            ZipCode: null,
            VendorStates: { Card: 1, Paypal: 0 },
        } as unknown as PaymentStatus;

        const result = normalizePaymentMethodStatus(status);

        expect(result.CountryCode).toBe('US');
        expect(result.State).toBe(getDefaultState('US'));
        expect(result.ZipCode).toBeNull();
        expect(result.VendorStates).toEqual({ Card: true, Paypal: false, Cash: true });
    });
});
