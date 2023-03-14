import {
    CountryOption,
    divideSortedCountries,
    getCountryDropdownOptions,
    groupCountriesByStartingLetter,
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
            expect(getCountryDropdownOptions(countryOptions)).toEqual(dropdownOptions);
        });

        it('should return dropdown options with pre-selected options', () => {
            const preSelectedOption: CountryOption = { countryName: 'France', countryCode: 'fr' };

            const expected = [
                { type: 'divider', text: 'Based on your time zone' },
                { type: 'country', countryName: 'France', countryCode: 'fr' },
                ...dropdownOptions,
            ];

            expect(getCountryDropdownOptions(countryOptions, preSelectedOption)).toEqual(expected);
        });

        it('should return dropdown options with pre-selected options and divider text', () => {
            const dividerText = 'Whatever';
            const preSelectedOption: CountryOption = { countryName: 'France', countryCode: 'fr' };

            const expected = [
                { type: 'divider', text: dividerText },
                { type: 'country', countryName: 'France', countryCode: 'fr' },
                ...dropdownOptions,
            ];

            expect(getCountryDropdownOptions(countryOptions, preSelectedOption, dividerText)).toEqual(expected);
        });
    });
});
