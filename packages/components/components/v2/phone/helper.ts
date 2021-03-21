import parsePhoneNumberFromString, {
    AsYouType,
    CountryCode,
    formatIncompletePhoneNumber,
    getCountryCallingCode,
    getExampleNumber,
} from 'libphonenumber-js/min';
import metadata from 'libphonenumber-js/metadata.min.json';
import examples from 'libphonenumber-js/examples.mobile.json';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { getFlagSvg } from './flagSvgs';
import { callingCodeToLeading, countries } from './data';

export const getTrimmedString = (string: string) => {
    // Handle (123) -> (123
    const slicedValue = string.match(/\([\d]+$/) ? string.slice(0, -1) : string;
    // Remove everything except numbers and +
    const trimmedString = slicedValue.replace(/[^0-9+]+/g, '');
    if (!trimmedString.length) {
        return '';
    }
    // Remove all + in case there are multiple
    return trimmedString[0] + trimmedString.slice(1).replace(/\+/g, '');
};

export const getSafeCountryCallingCode = (country: string) => {
    try {
        return getCountryCallingCode(country as CountryCode) as string;
    } catch (e) {
        return '';
    }
};

export const getCountryFromCallingCode = (callingCode: string) => {
    // @ts-ignore
    const countries = metadata.country_calling_codes[callingCode];
    if (!countries || countries.length === 0) {
        return;
    }
    if (countries.length === 1) {
        return countries[0];
    }
    return countries[0];
};

export const getNumberWithCountryCode = (value: string, countryCallingCode: string) => {
    if (value.includes('+')) {
        return value;
    }
    if (!countryCallingCode) {
        return value;
    }
    return `+${countryCallingCode}${value}`;
};

export const getExamplePlaceholder = (country: string) => {
    const example = getExampleNumber(country as CountryCode, examples);
    if (!example) {
        return '';
    }
    return example.formatInternational();
};

export const getNumberWithoutCountryCode = (value: string, countryCallingCode: string) => {
    return value.replace(`+${countryCallingCode}`, '').trim();
};

export const getCountryFromNumber = (value: string) => {
    const asYouType = new AsYouType();
    asYouType.input(value);
    const result = asYouType.getNumber();
    if (result) {
        return result.country || getCountryFromCallingCode(result.countryCallingCode as string) || '';
    }
    // @ts-ignore Types are wrong
    const country = asYouType.getCountry?.() as CountryCode;
    if (country) {
        return country;
    }
    if (!value.length) {
        return '';
    }
    if (value[0] === '+') {
        const callingCode = value.slice(1);
        const country = getCountryFromCallingCode(callingCode);
        return country || '';
    }
    return '';
};

export interface CountryOptionData {
    countryCode: string;
    countryName: string;
    countryCallingCode: string;
    countryFlag: string;
}

export const getCountries = (): CountryOptionData[] => {
    return Object.keys(metadata.countries)
        .map((countryCode): CountryOptionData | undefined => {
            const countryCallingCode = getSafeCountryCallingCode(countryCode as CountryCode);
            const countryName = countries[countryCode];
            const countryFlag = getFlagSvg(countryCode);
            if (!countryFlag || !countryName || !countryCallingCode) {
                return;
            }
            return {
                countryCode,
                countryName,
                countryCallingCode,
                countryFlag,
            };
        })
        .filter(isTruthy)
        .sort((a, b) => a.countryName.localeCompare(b.countryName));
};

export const getCursorPosition = (digitIndex: number, value: string) => {
    const regex = /[\d+]/;

    let n = 0;
    let i = 0;

    for (; i < value.length; ++i) {
        if (value[i].match(regex)) {
            if (n++ >= digitIndex) {
                break;
            }
        }
    }

    if (!value[i - 1]?.match(regex)) {
        i -= 1;
    }

    return Math.max(0, Math.min(i, value.length));
};

export const getFormattedValue = (number: string) => {
    const result = parsePhoneNumberFromString(number);
    if (result && result.isValid()) {
        return result.formatInternational();
    }
    return formatIncompletePhoneNumber(number);
};

export const getSpecificCountry = (
    value: string,
    countryCallingCode: string,
    countryCode: string
): [string, number] => {
    const leadings = callingCodeToLeading[countryCallingCode];
    if (!leadings) {
        return [countryCode, 0];
    }
    return leadings.reduce(
        (acc, { countryCode, areaCodes }) => {
            const result = areaCodes.find((areaCode) => value.startsWith(areaCode));
            if (result && result.length >= acc[1]) {
                return [countryCode, result.length];
            }
            return acc;
        },
        [countryCode, 0]
    );
};

export const getSpecificMaxLength = (countryCallingCode: string, countryCode: string) => {
    const leadings = callingCodeToLeading[countryCallingCode] || [];
    const areaCodes =
        leadings.find((leading) => {
            return countryCode === leading.countryCode;
        })?.areaCodes || [];
    return areaCodes.reduce((acc, cur) => {
        return Math.max(acc, cur.length);
    }, 0);
};
