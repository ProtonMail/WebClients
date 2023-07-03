import { c } from 'ttag';

import { SimpleMap } from '@proton/shared/lib/interfaces';

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

export const getIsCountryOption = (option: DropdownOption): option is DropdownCountryOption => {
    return !!(option as DropdownCountryOption).countryCode;
};

export const PRESELECTED_COUNTRY_OPTION_SUFFIX = '-preselected';

export const isPreselectedOption = (code: string) => code.endsWith(PRESELECTED_COUNTRY_OPTION_SUFFIX);

export const getCleanCountryCode = (code: string) => {
    return isPreselectedOption(code) ? code.slice(0, -PRESELECTED_COUNTRY_OPTION_SUFFIX.length) : code;
};

/**
 * Transform a standard country option to a preselected option, suffixing it with `-preselected` to make it non searchable and focused on modal open.
 * @param option Option to transform
 *
 * Example, given
 * { countryName: 'France', countryCode: 'fr' },
 *
 * The function will return
 * { countryName: 'France', countryCode: 'fr-preselected' },
 */
export const optionToPreselectedOption = (option: CountryOption): CountryOption => {
    if (option.countryCode.endsWith(PRESELECTED_COUNTRY_OPTION_SUFFIX)) {
        return option;
    }

    return {
        // adding a suffix here to make this option non searchable. The ideal solution would be to have an object here
        countryCode: `${option.countryCode}${PRESELECTED_COUNTRY_OPTION_SUFFIX}`,
        countryName: option.countryName,
    };
};

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
export const divideSortedCountries = (groupedCountries: SimpleMap<CountryOption[]>) => {
    const sortedCountryKeys = Object.keys(groupedCountries).sort((a, b) => a.localeCompare(b));

    const flatAndDividedArray: DropdownOption[] = [{ type: 'divider', text: sortedCountryKeys[0] }];

    sortedCountryKeys.forEach((letter, i) => {
        const countries = groupedCountries[letter];

        if (!countries) {
            return;
        }

        const countryOptions: DropdownCountryOption[] = countries.map(({ countryCode, countryName }) => ({
            type: 'country',
            countryName,
            countryCode,
        }));

        flatAndDividedArray.push(...countryOptions, { type: 'divider', text: sortedCountryKeys[i + 1] });
    });

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
export const getAllDropdownOptions = (
    options: CountryOption[],
    preSelectedOption?: CountryOption,
    preSelectedOptionDivider = c('Country select label').t`Based on your time zone`
) => {
    const preselected: DropdownOption[] = preSelectedOption
        ? [
              { type: 'divider', text: preSelectedOptionDivider },
              {
                  type: 'country',
                  ...optionToPreselectedOption(preSelectedOption),
              },
          ]
        : [];

    // Group all countries by their starting letter
    const sortedCountries = groupCountriesByStartingLetter(options);

    // Flatten the object and add their dividers
    const allCountries = divideSortedCountries(sortedCountries);

    return [...preselected, ...allCountries];
};
