import { c } from 'ttag';

export interface CountryOption {
    countryCode: string;
    countryName: string;
}

interface DropdownCountryOption {
    type: 'country';
    countryName: string;
    countryCode: string;
}

interface DropdownDividerOption {
    type: 'divider';
    text: string;
}

export type DropdownOption = DropdownCountryOption | DropdownDividerOption;

/**
 * Group all countries by their starting letter in an object with the first letter as the key
 * @param countries Country options to sort
 *
 * Example, given
 * [
 *      {countryName: 'France', countryCode: 'fr'},
 *      {countryName: 'Switzerland', countryCode: 'ch'},
 * ]
 *
 * The function will return
 * {
 *     F: [
 *         {countryName: 'France', countryCode: 'fr'},
 *     ],
 *     S: [
 *         {countryName: 'Switzerland', countryCode: 'ch'},
 *     ]
 * }
 */
export const groupCountriesByStartingLetter = (countries: CountryOption[]) => {
    return countries.reduce<{ [key: string]: CountryOption[] }>((acc, country) => {
        const startingLetter = country.countryName[0].toUpperCase();
        if (!acc[startingLetter]) {
            acc[startingLetter] = [];
        }
        acc[startingLetter].push(country);
        return acc;
    }, {});
};

/**
 * Flatten grouped countries and divide them by a divider option
 * @param groupedCountries grouped countries to flatten and split by dividers
 *
 * Example, given
 * {
 *     F: [
 *         {countryName: 'France', countryCode: 'fr'},
 *     ],
 *     S: [
 *         {countryName: 'Switzerland', countryCode: 'ch'},
 *     ]
 * }
 *
 * The function will return
 * [
 *      {type: 'divider', text: 'F'},
 *      {type: 'country', countryName: 'France', countryCode: 'fr'},
 *
 *      {type: 'divider', text: 'S'},
 *      {type: 'country', countryName: 'Switzerland', countryCode: 'ch'},
 * ]
 */
export const divideSortedCountries = (groupedCountries: { [key: string]: CountryOption[] }) => {
    const sortedKeys = Object.keys(groupedCountries).sort((a, b) => a.localeCompare(b));

    const flatAndDividedArray: DropdownOption[] = sortedKeys
        .map((letter) =>
            groupedCountries[letter].map(
                (country) =>
                    ({
                        type: 'country',
                        countryName: country.countryName,
                        countryCode: country.countryCode,
                    } as DropdownOption)
            )
        )
        .reduce(
            (acc, countries, i) => acc.concat(countries, { type: 'divider', text: sortedKeys[i + 1] }),
            [{ type: 'divider', text: sortedKeys[0] }]
        );

    flatAndDividedArray.pop();

    return flatAndDividedArray;
};

/**
 * Get Country dropdown options.
 * Returns an array of DropdownOption, displaying the optional pre-selected option at the top,
 * and splitting options with dividers based on their first letter
 * @param options: country options to display
 * @param preSelectedOption: (optional) pre-selected option that will be the first one displayed in the dropdown
 * @param preSelectedOptionDivider: (optional) pre-selected option label displayed on top of the option
 * @returns DropdownOption[]
 *
 * Example, given
 * options = [
 *              {countryName: 'France', countryCode: 'fr'},
 *              {countryName: 'Switzerland', countryCode: 'ch'},
 *              {countryName: 'Australia', countryCode: 'au'},
 *              {countryName: 'Austria', countryCode: 'at'},
 *          ]
 * preSelectedOption = {countryName: 'France', countryCode: 'fr'}
 *
 * The function will return
 * [
 *      // pre-selected option
 *      {type: 'divider', text: 'Based on your time zone'},
 *      {type: 'country', countryName: 'France', countryCode: 'fr'},
 *
 *      {type: 'divider', text: 'A'},
 *      {type: 'country', countryName: 'Australia', countryCode 'au'},
 *      {type: 'country', countryName: 'Austria', countryCode: 'at'},
 *
 *      {type: 'divider', text: 'F'},
 *      {type: 'country', countryName: 'France', countryCode: 'fr'},
 *
 *      {type: 'divider', text: 'S'},
 *      {type: 'country', countryName: 'Switzerland', countryCode: 'ch'},
 * ]
 */
export const getCountryDropdownOptions = (
    options: CountryOption[],
    preSelectedOption?: CountryOption,
    preSelectedOptionDivider = c('Country select label').t`Based on your time zone`
) => {
    const preselected: DropdownOption[] = preSelectedOption
        ? [
              { type: 'divider', text: preSelectedOptionDivider },
              {
                  type: 'country',
                  countryCode: preSelectedOption.countryCode,
                  countryName: preSelectedOption.countryName,
              },
          ]
        : [];

    // Group all countries by their starting letter
    const sortedCountries = groupCountriesByStartingLetter(options);

    // Flatten the object and add their dividers
    const allCountries = divideSortedCountries(sortedCountries);

    return [...preselected, ...allCountries];
};
