import { getDefaultPostalCodeByStateCode } from '../../postal-codes/default-postal-codes';
import { getDefaultState, getStateList, isCountryWithStates } from '../countries';
import type { PaymentStatus } from '../interface';
import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS } from './billing-address';
import { getFullBillingAddressFromPaymentStatus } from './billing-address-from-payments-status';

function createPaymentStatus(billingAddress: Partial<BillingAddress>): PaymentStatus {
    return {
        CountryCode: billingAddress.CountryCode ?? '',
        State: billingAddress.State ?? null,
        ZipCode: billingAddress.ZipCode ?? null,
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
            Google: true,
        },
    };
}

describe('getFullBillingAddressFromPaymentStatus', () => {
    it('should return FullBillingAddress wrapping the normalized billing address', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'US',
            State: 'CA',
            ZipCode: '94105',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result).toEqual({
            BillingAddress: {
                CountryCode: 'US',
                State: 'CA',
                ZipCode: '94105',
            },
        });
    });

    it('should restore defaults when country code is missing', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: '',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.CountryCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.CountryCode);
        expect(result.BillingAddress.State).toBe(DEFAULT_TAX_BILLING_ADDRESS.State);
        expect(result.BillingAddress.ZipCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.ZipCode);
    });

    it('should assign default state when state is missing for US', () => {
        const defaultUSState = getDefaultState('US');
        const paymentStatus = createPaymentStatus({
            CountryCode: 'US',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.State).toBe(defaultUSState);
        expect(result.BillingAddress.ZipCode).toBe(getDefaultPostalCodeByStateCode('US', defaultUSState));
    });

    it('should assign first state when state is missing for CA', () => {
        const firstCAStateCode = getStateList('CA')[0].stateCode;
        const paymentStatus = createPaymentStatus({
            CountryCode: 'CA',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.State).toBe(firstCAStateCode);
    });

    it('should not modify state for countries without states', () => {
        const nonStateCountry = 'GB';
        expect(isCountryWithStates(nonStateCountry)).toBe(false);

        const paymentStatus = createPaymentStatus({
            CountryCode: nonStateCountry,
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.State).toBeNull();
    });

    it('should assign default zip code for US when zip code is missing but state is present', () => {
        const stateCode = 'NY';
        const paymentStatus = createPaymentStatus({
            CountryCode: 'US',
            State: stateCode,
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.ZipCode).toBe(getDefaultPostalCodeByStateCode('US', stateCode));
    });

    it('should not replace zip code for US when zip code is already present', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'US',
            State: 'CA',
            ZipCode: '90210',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.ZipCode).toBe('90210');
    });

    it('should assign default postal code for CA when postal code is missing but state is present', () => {
        const stateCode = 'ON';
        const paymentStatus = createPaymentStatus({
            CountryCode: 'CA',
            State: stateCode,
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.ZipCode).toBe(getDefaultPostalCodeByStateCode('CA', stateCode));
    });

    it('should reconstruct partially missing postal code for CA (3 chars)', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'CA',
            State: 'ON',
            ZipCode: 'M5H',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.ZipCode).toBe('M5H 0A0');
    });

    it('should not reconstruct CA postal code if it is already valid', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'CA',
            State: 'ON',
            ZipCode: 'M5H 2N2',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.ZipCode).toBe('M5H 2N2');
    });

    it('should reconstruct missing state by postal code for US', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'US',
            ZipCode: '90001',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.CountryCode).toBe('US');
        expect(result.BillingAddress.State).toBe('CA');
        expect(result.BillingAddress.ZipCode).toBe('90001');
    });

    it('should reconstruct missing state by postal code for CA', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'CA',
            ZipCode: 'M5H 2N2',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.CountryCode).toBe('CA');
        expect(result.BillingAddress.State).toBe('ON');
        expect(result.BillingAddress.ZipCode).toBe('M5H 2N2');
    });

    it('should reset state and postal code if state reconstruction fails for US', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'US',
            ZipCode: 'wrong zip code',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.CountryCode).toBe('US');
        expect(result.BillingAddress.State).toBe(getDefaultState('US'));
        expect(result.BillingAddress.ZipCode).toBe(getDefaultPostalCodeByStateCode('US', getDefaultState('US')));
    });

    it('should reset state and postal code if state reconstruction fails for CA', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'CA',
            ZipCode: 'invalid postal code',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.CountryCode).toBe('CA');
        expect(result.BillingAddress.State).toBe(getDefaultState('CA'));
        expect(result.BillingAddress.ZipCode).toBe(getDefaultPostalCodeByStateCode('CA', getDefaultState('CA')));
    });

    it('should not assign postal code for countries that do not require it', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'GB',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.ZipCode).toBeNull();
    });

    it('should assign default state for IN when state is missing', () => {
        const firstINStateCode = getStateList('IN')[0].stateCode;
        const paymentStatus = createPaymentStatus({
            CountryCode: 'IN',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.State).toBe(firstINStateCode);
    });

    it('should not assign zip code for IN (no postal code requirement)', () => {
        const paymentStatus = createPaymentStatus({
            CountryCode: 'IN',
            State: 'KA',
        });

        const result = getFullBillingAddressFromPaymentStatus(paymentStatus);
        expect(result.BillingAddress.ZipCode).toBeNull();
    });
});
