import { getDefaultPostalCodeByStateCode } from '../postal-codes/default-postal-codes';
import {
    type BillingAddress,
    DEFAULT_TAX_BILLING_ADDRESS,
    getBillingAddressFromPaymentsStatus,
    getBillingAddressStatus,
} from './billing-address';
import { countriesWithStates, getDefaultState, getStateList, isCountryWithStates } from './countries';

describe('isBillingAddressValid', () => {
    it.each(['DE', 'FR', 'CH', 'GB'])(
        'should return true for regular countries without State condition - %s',
        (CountryCode) => {
            expect(getBillingAddressStatus({ CountryCode })).toEqual({ valid: true });
        }
    );

    it('should return false if CountryCode is not specified', () => {
        expect(getBillingAddressStatus({} as any)).toEqual({ valid: false, reason: 'missingCountry' });
        expect(getBillingAddressStatus({ CountryCode: '' })).toEqual({ valid: false, reason: 'missingCountry' });
        expect(getBillingAddressStatus({ CountryCode: null } as any)).toEqual({
            valid: false,
            reason: 'missingCountry',
        });
        expect(getBillingAddressStatus({ CountryCode: undefined } as any)).toEqual({
            valid: false,
            reason: 'missingCountry',
        });
    });

    it.each(countriesWithStates)(
        'should return false if CountryCode is specified but state is not - %s',
        (CountryCode) => {
            expect(getBillingAddressStatus({ CountryCode })).toEqual({ valid: false, reason: 'missingState' });
            expect(getBillingAddressStatus({ CountryCode, State: null })).toEqual({
                valid: false,
                reason: 'missingState',
            });
            expect(getBillingAddressStatus({ CountryCode, State: undefined })).toEqual({
                valid: false,
                reason: 'missingState',
            });
            expect(getBillingAddressStatus({ CountryCode, State: '' })).toEqual({
                valid: false,
                reason: 'missingState',
            });
        }
    );

    it('should return true if CountryCode and State are specified', () => {
        expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: '35226' })).toEqual({ valid: true });
        expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL', ZipCode: 'T5J 2R7' })).toEqual({
            valid: true,
        });
    });

    describe('Zip code validation', () => {
        it('should return false if zipCodeValid parameter is false', () => {
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: '35226' }, false)).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
            expect(getBillingAddressStatus({ CountryCode: 'DE' }, false)).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
        });

        it.each(['US', 'CA'])(
            'should return false if CountryCode requires postal code but ZipCode is missing - %s',
            (CountryCode) => {
                const state = CountryCode === 'US' ? 'AL' : 'NL';

                expect(getBillingAddressStatus({ CountryCode, State: state })).toEqual({
                    valid: false,
                    reason: 'missingZipCode',
                });
                expect(getBillingAddressStatus({ CountryCode, State: state, ZipCode: null })).toEqual({
                    valid: false,
                    reason: 'missingZipCode',
                });
                expect(getBillingAddressStatus({ CountryCode, State: state, ZipCode: undefined })).toEqual({
                    valid: false,
                    reason: 'missingZipCode',
                });
                expect(getBillingAddressStatus({ CountryCode, State: state, ZipCode: '' })).toEqual({
                    valid: false,
                    reason: 'missingZipCode',
                });
            }
        );

        it('should return false for invalid US zip codes', () => {
            // Invalid zip codes for US
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: '1234' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: '123456' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: 'ABCDE' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
            // Wrong zip code for state (using NY zip for AL state)
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: '10001' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
        });

        it('should return false for invalid Canadian postal codes', () => {
            // Invalid postal codes for Canada
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL', ZipCode: '12345' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL', ZipCode: 'ABCDEF' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL', ZipCode: 'A1A 1A' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL', ZipCode: 'A1A 1A12' })).toEqual({
                valid: false,
                reason: 'invalidZipCode',
            });
        });

        it('should return true for valid US zip codes', () => {
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: '35226' })).toEqual({
                valid: true,
            });
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL', ZipCode: '35226-1234' })).toEqual({
                valid: true,
            });
            expect(getBillingAddressStatus({ CountryCode: 'US', State: 'NY', ZipCode: '10001' })).toEqual({
                valid: true,
            });
        });

        it('should return true for valid Canadian postal codes', () => {
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL', ZipCode: 'A1C 5M2' })).toEqual({
                valid: true,
            });
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL', ZipCode: 'A1C5M2' })).toEqual({
                valid: true,
            });
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'ON', ZipCode: 'M5H-2N2' })).toEqual({
                valid: true,
            });
            expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'AB', ZipCode: 'T5J.2R7' })).toEqual({
                valid: true,
            });
        });

        it('should return true for countries that do not require postal codes even with invalid states', () => {
            // Countries with states but no postal code requirement
            expect(getBillingAddressStatus({ CountryCode: 'AU', State: 'NSW' })).toEqual({ valid: true });
            expect(getBillingAddressStatus({ CountryCode: 'BR', State: 'SP' })).toEqual({ valid: true });
        });
    });
});

describe('getBillingAddressFromPaymentsStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should apply all normalizations when all fields are missing', () => {
        const billingAddress = {} as BillingAddress; // Simulate all fields missing

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.CountryCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.CountryCode);
        expect(result.State).toBe(DEFAULT_TAX_BILLING_ADDRESS.State);
        expect(result.ZipCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.ZipCode);
    });

    it('should return the same object when all fields are present', () => {
        const billingAddress: BillingAddress = {
            CountryCode: 'US',
            State: 'CA',
            ZipCode: '94105',
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result).toEqual(billingAddress);
        expect(result).not.toBe(billingAddress); // Should be a new object
    });

    it('should assign default state when state is missing for US', () => {
        // Get the first US state code for expectations
        const firstUSStateCode = getDefaultState('US');

        const billingAddress: BillingAddress = {
            CountryCode: 'US',
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.State).toBe(firstUSStateCode);
        expect(result.ZipCode).toBe(getDefaultPostalCodeByStateCode('US', firstUSStateCode));
    });

    it('should assign first state when state is missing for CA', () => {
        // Get the first CA state code for expectations
        const firstCAStateCode = getStateList('CA')[0].stateCode;

        const billingAddress: BillingAddress = {
            CountryCode: 'CA',
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.State).toBe(firstCAStateCode);
    });

    it('should not modify state for countries without states', () => {
        const nonStateCountry = 'GB'; // UK doesn't have states in this system
        expect(isCountryWithStates(nonStateCountry as any)).toBe(false);

        const billingAddress: BillingAddress = {
            CountryCode: nonStateCountry,
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.State).toBeUndefined();
    });

    it('should assign default zip code for US when zip code is missing but state is present', () => {
        const stateCode = 'NY';
        const billingAddress: BillingAddress = {
            CountryCode: 'US',
            State: stateCode,
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        // Use the actual expected ZIP code for NY
        const expectedZipCode = getDefaultPostalCodeByStateCode('US', stateCode);
        expect(result.ZipCode).toBe(expectedZipCode);
    });

    it('should not assign zip code for US when zip code is already present', () => {
        const existingZipCode = '90210';
        const billingAddress: BillingAddress = {
            CountryCode: 'US',
            State: 'CA',
            ZipCode: existingZipCode,
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.ZipCode).toBe(existingZipCode);
    });

    it('should assign default postal code for CA when postal code is missing but state is present', () => {
        const stateCode = 'ON';
        const billingAddress: BillingAddress = {
            CountryCode: 'CA',
            State: stateCode,
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        // Use the actual expected postal code for ON
        const expectedPostalCode = getDefaultPostalCodeByStateCode('CA', stateCode);
        expect(result.ZipCode).toBe(expectedPostalCode);
    });

    it('should not assign postal code for countries other than US and CA', () => {
        const nonPostalCodeCountry = 'GB'; // UK doesn't require postal codes in this system
        expect(isCountryWithStates(nonPostalCodeCountry as any)).toBe(false);

        const billingAddress: BillingAddress = {
            CountryCode: nonPostalCodeCountry,
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.ZipCode).toBeUndefined();
    });

    it('should reconstruct the missing state by postal code - US', () => {
        const billingAddress: BillingAddress = {
            CountryCode: 'US',
            ZipCode: '90001',
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.CountryCode).toBe('US');
        expect(result.State).toBe('CA');
        expect(result.ZipCode).toBe('90001');
    });

    it('should reconstruct the missing state by postal code - CA', () => {
        const billingAddress: BillingAddress = {
            CountryCode: 'CA',
            ZipCode: 'M5H 2N2', // Ontario postal code
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.CountryCode).toBe('CA');
        expect(result.State).toBe('ON');
        expect(result.ZipCode).toBe('M5H 2N2');
    });

    it('missing state - it should reset state and postal code if state reconstruction failed - US', () => {
        const billingAddress: BillingAddress = {
            CountryCode: 'US',
            ZipCode: 'wrong zip code',
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.CountryCode).toBe('US');

        expect(result.State).toEqual(getDefaultState('US'));
        expect(result.ZipCode).toEqual(getDefaultPostalCodeByStateCode('US', getDefaultState('US')));
    });

    it('missing state - it should reset state and postal code if state reconstruction failed - CA', () => {
        const billingAddress: BillingAddress = {
            CountryCode: 'CA',
            ZipCode: 'invalid postal code',
        };

        const result = getBillingAddressFromPaymentsStatus(billingAddress);
        expect(result.CountryCode).toBe('CA');

        expect(result.State).toEqual(getDefaultState('CA'));
        expect(result.ZipCode).toEqual(getDefaultPostalCodeByStateCode('CA', getDefaultState('CA')));
    });
});
