import { countriesWithVatNumberOnSignup } from './countriesWithVatId';
import { EXPECTED_VAT_ID_COUNTRIES } from './vatIdCountries.testdata';

describe('countriesWithVatNumberOnSignup', () => {
    it('does not drift from the expected list of VAT id countries', () => {
        expect([...countriesWithVatNumberOnSignup].sort()).toEqual([...EXPECTED_VAT_ID_COUNTRIES].sort());
    });
});
