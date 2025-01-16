import { getBillingAddressStatus } from './billing-address';
import { countriesWithStates } from './countries';

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
        expect(getBillingAddressStatus({ CountryCode: 'US', State: 'AL' })).toEqual({ valid: true });
        expect(getBillingAddressStatus({ CountryCode: 'CA', State: 'NL' })).toEqual({ valid: true });
    });
});
