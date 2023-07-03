import {
    CountryOption,
    PRESELECTED_COUNTRY_OPTION_SUFFIX,
    divideSortedCountries,
    getAllDropdownOptions,
    getCleanCountryCode,
    groupCountriesByStartingLetter,
    optionToPreselectedOption,
} from '@proton/components/components/country/helpers';

const countryOptions: CountryOption[] = [
    { countryName: 'France', countryCode: 'fr' },
    { countryName: 'Switzerland', countryCode: 'ch' },
    { countryName: 'Australia', countryCode: 'au' },
    { countryName: 'Finland', countryCode: 'fi' },
];

const groupedCountries = {
    A: [{ countryName: 'Australia', countryCode: 'au' }],
    F: [
        { countryName: 'France', countryCode: 'fr' },
        { countryName: 'Finland', countryCode: 'fi' },
    ],
    S: [{ countryName: 'Switzerland', countryCode: 'ch' }],
};

const dropdownOptions = [
    { type: 'divider', text: 'A' },
    { type: 'country', countryName: 'Australia', countryCode: 'au' },

    { type: 'divider', text: 'F' },
    { type: 'country', countryName: 'France', countryCode: 'fr' },
    { type: 'country', countryName: 'Finland', countryCode: 'fi' },

    { type: 'divider', text: 'S' },
    { type: 'country', countryName: 'Switzerland', countryCode: 'ch' },
];

describe('CountrySelect helpers', () => {
    describe('groupCountriesByStartingLetter', () => {
        it('should group countries options by their starting letters', () => {
            expect(groupCountriesByStartingLetter(countryOptions)).toEqual(groupedCountries);
        });
    });

    describe('divideSortedCountries', () => {
        it('should create dropdown options split by dividers', () => {
            expect(divideSortedCountries(groupedCountries)).toEqual(dropdownOptions);
        });
    });

    describe('getCountryDropdownOptions', () => {
        it('should return expected dropdown options', () => {
            expect(getAllDropdownOptions(countryOptions)).toEqual(dropdownOptions);
        });

        it('should return dropdown options with pre-selected options', () => {
            const preSelectedOption: CountryOption = { countryName: 'France', countryCode: 'fr' };

            const expected = [
                { type: 'divider', text: 'Based on your time zone' },
                { type: 'country', countryName: 'France', countryCode: 'fr-preselected' },
                ...dropdownOptions,
            ];

            expect(getAllDropdownOptions(countryOptions, preSelectedOption)).toEqual(expected);
        });

        it('should return dropdown options with pre-selected options and divider text', () => {
            const dividerText = 'Whatever';
            const preSelectedOption: CountryOption = { countryName: 'France', countryCode: 'fr' };

            const expected = [
                { type: 'divider', text: dividerText },
                { type: 'country', countryName: 'France', countryCode: 'fr-preselected' },
                ...dropdownOptions,
            ];

            expect(getAllDropdownOptions(countryOptions, preSelectedOption, dividerText)).toEqual(expected);
        });
    });

    describe('getCleanCountryCode', () => {
        it('cleans the pre-selected suffix', () => {
            expect(getCleanCountryCode(`fr${PRESELECTED_COUNTRY_OPTION_SUFFIX}`)).toEqual('fr');
        });

        it('returns the country code if no suffix is present', () => {
            expect(getCleanCountryCode('ch')).toEqual('ch');
        });
    });

    describe('optionToPreselectedOption', () => {
        it('should add `-preselected` suffix to option countryCode', () => {
            expect(optionToPreselectedOption({ countryName: 'France', countryCode: 'fr' })).toEqual({
                countryName: 'France',
                countryCode: 'fr-preselected',
            });
        });

        it('should return option as it is if already suffixed', () => {
            expect(optionToPreselectedOption({ countryName: 'France', countryCode: 'fr-preselected' })).toEqual({
                countryName: 'France',
                countryCode: 'fr-preselected',
            });
        });
    });
});
