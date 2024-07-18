import { c } from 'ttag';

import { localeCode } from '@proton/shared/lib/i18n';

const getTopCounties = () => [
    { value: 'US', label: c('Country name').t`United States` },
    { value: 'GB', label: c('Country name').t`United Kingdom` },
    { value: 'CH', label: c('Country name').t`Switzerland` },
    { value: 'FR', label: c('Country name').t`France` },
    { value: 'DE', label: c('Country name').t`Germany` },
    { value: 'CA', label: c('Country name').t`Canada` },
];
export const DEFAULT_SEPARATOR = {
    label: '------------------',
    value: '',
    disabled: true,
    key: 'separator',
};

// It has to be wrapped in a function because otherwise the tranlsations will not be available at the time when
// the expression is evaluated
const getCountries = () => [
    { value: 'AF', label: c('Country name').t`Afghanistan` },
    { value: 'AL', label: c('Country name').t`Albania` },
    { value: 'DZ', label: c('Country name').t`Algeria` },
    { value: 'AD', label: c('Country name').t`Andorra` },
    { value: 'AO', label: c('Country name').t`Angola` },
    { value: 'AI', label: c('Country name').t`Anguilla` },
    { value: 'AG', label: c('Country name').t`Antigua and Barbuda` },
    { value: 'AR', label: c('Country name').t`Argentina` },
    { value: 'AM', label: c('Country name').t`Armenia` },
    { value: 'AW', label: c('Country name').t`Aruba` },
    { value: 'AU', label: c('Country name').t`Australia` },
    { value: 'AT', label: c('Country name').t`Austria` },
    { value: 'AZ', label: c('Country name').t`Azerbaijan` },
    { value: 'BS', label: c('Country name').t`Bahamas` },
    { value: 'BH', label: c('Country name').t`Bahrain` },
    { value: 'BD', label: c('Country name').t`Bangladesh` },
    { value: 'BB', label: c('Country name').t`Barbados` },
    { value: 'BY', label: c('Country name').t`Belarus` },
    { value: 'BE', label: c('Country name').t`Belgium` },
    { value: 'BZ', label: c('Country name').t`Belize` },
    { value: 'BJ', label: c('Country name').t`Benin` },
    { value: 'BM', label: c('Country name').t`Bermuda` },
    { value: 'BT', label: c('Country name').t`Bhutan` },
    { value: 'BO', label: c('Country name').t`Bolivia` },
    { value: 'BA', label: c('Country name').t`Bosnia and Herzegovina` },
    { value: 'BW', label: c('Country name').t`Botswana` },
    { value: 'BV', label: c('Country name').t`Bouvet Island` },
    { value: 'BR', label: c('Country name').t`Brazil` },
    { value: 'IO', label: c('Country name').t`British Indian Ocean Territory` },
    { value: 'VG', label: c('Country name').t`British Virgin Islands` },
    { value: 'BN', label: c('Country name').t`Brunei Darussalam` },
    { value: 'BG', label: c('Country name').t`Bulgaria` },
    { value: 'BF', label: c('Country name').t`Burkina Faso` },
    { value: 'BI', label: c('Country name').t`Burundi` },
    { value: 'KH', label: c('Country name').t`Cambodia` },
    { value: 'CM', label: c('Country name').t`Cameroon` },
    { value: 'CA', label: c('Country name').t`Canada` },
    { value: 'CV', label: c('Country name').t`Cape Verde` },
    { value: 'KY', label: c('Country name').t`Cayman Islands` },
    { value: 'CF', label: c('Country name').t`Central African Republic` },
    { value: 'TD', label: c('Country name').t`Chad` },
    { value: 'CL', label: c('Country name').t`Chile` },
    { value: 'CN', label: c('Country name').t`China` },
    { value: 'CX', label: c('Country name').t`Christmas Island` },
    { value: 'CC', label: c('Country name').t`Cocos (Keeling) Islands` },
    { value: 'CO', label: c('Country name').t`Colombia` },
    { value: 'KM', label: c('Country name').t`Comoros` },
    { value: 'CG', label: c('Country name').t`Congo` },
    { value: 'CD', label: c('Country name').t`Congo (The Democratic Republic of the)` },
    { value: 'CK', label: c('Country name').t`Cook Islands` },
    { value: 'CR', label: c('Country name').t`Costa Rica` },
    { value: 'CI', label: c('Country name').t`Côte d'Ivoire` },
    { value: 'HR', label: c('Country name').t`Croatia` },
    { value: 'CU', label: c('Country name').t`Cuba` },
    { value: 'CW', label: c('Country name').t`Curaçao` },
    { value: 'CY', label: c('Country name').t`Cyprus` },
    { value: 'CZ', label: c('Country name').t`Czech Republic` },
    { value: 'DK', label: c('Country name').t`Denmark` },
    { value: 'DJ', label: c('Country name').t`Djibouti` },
    { value: 'DM', label: c('Country name').t`Dominica` },
    { value: 'DO', label: c('Country name').t`Dominican Republic` },
    { value: 'TL', label: c('Country name').t`East Timor` },
    { value: 'EC', label: c('Country name').t`Ecuador` },
    { value: 'EG', label: c('Country name').t`Egypt` },
    { value: 'SV', label: c('Country name').t`El Salvador` },
    { value: 'GQ', label: c('Country name').t`Equatorial Guinea` },
    { value: 'ER', label: c('Country name').t`Eritrea` },
    { value: 'EE', label: c('Country name').t`Estonia` },
    { value: 'ET', label: c('Country name').t`Ethiopia` },
    { value: 'FK', label: c('Country name').t`Falkland Islands (Malvinas)` },
    { value: 'FO', label: c('Country name').t`Faroe Islands` },
    { value: 'FJ', label: c('Country name').t`Fiji` },
    { value: 'FI', label: c('Country name').t`Finland` },
    { value: 'FR', label: c('Country name').t`France` },
    { value: 'GF', label: c('Country name').t`French Guiana` },
    { value: 'PF', label: c('Country name').t`French Polynesia` },
    { value: 'TF', label: c('Country name').t`French Southern Territories` },
    { value: 'GA', label: c('Country name').t`Gabon` },
    { value: 'GM', label: c('Country name').t`Gambia` },
    { value: 'GE', label: c('Country name').t`Georgia` },
    { value: 'DE', label: c('Country name').t`Germany` },
    { value: 'GH', label: c('Country name').t`Ghana` },
    { value: 'GI', label: c('Country name').t`Gibraltar` },
    { value: 'GR', label: c('Country name').t`Greece` },
    { value: 'GL', label: c('Country name').t`Greenland` },
    { value: 'GD', label: c('Country name').t`Grenada` },
    { value: 'GP', label: c('Country name').t`Guadeloupe` },
    { value: 'GT', label: c('Country name').t`Guatemala` },
    { value: 'GN', label: c('Country name').t`Guinea` },
    { value: 'GW', label: c('Country name').t`Guinea-Bissau` },
    { value: 'GY', label: c('Country name').t`Guyana` },
    { value: 'HT', label: c('Country name').t`Haiti` },
    { value: 'HM', label: c('Country name').t`Heard Island and McDonald Islands` },
    { value: 'VA', label: c('Country name').t`Holy See (Vatican City State)` },
    { value: 'HN', label: c('Country name').t`Honduras` },
    { value: 'HK', label: c('Country name').t`Hong Kong` },
    { value: 'HU', label: c('Country name').t`Hungary` },
    { value: 'IS', label: c('Country name').t`Iceland` },
    { value: 'IN', label: c('Country name').t`India` },
    { value: 'ID', label: c('Country name').t`Indonesia` },
    { value: 'IQ', label: c('Country name').t`Iraq` },
    { value: 'IE', label: c('Country name').t`Ireland` },
    { value: 'IR', label: c('Country name').t`Islamic Republic of Iran` },
    { value: 'IL', label: c('Country name').t`Israel` },
    { value: 'IT', label: c('Country name').t`Italy` },
    { value: 'JM', label: c('Country name').t`Jamaica` },
    { value: 'JP', label: c('Country name').t`Japan` },
    { value: 'JO', label: c('Country name').t`Jordan` },
    { value: 'KZ', label: c('Country name').t`Kazakhstan` },
    { value: 'KE', label: c('Country name').t`Kenya` },
    { value: 'KI', label: c('Country name').t`Kiribati` },
    { value: 'KP', label: c('Country name').t`Korea (Democratic People's Republic of)` },
    { value: 'KR', label: c('Country name').t`Korea (Republic of)` },
    { value: 'KW', label: c('Country name').t`Kuwait` },
    { value: 'KG', label: c('Country name').t`Kyrgyzstan` },
    { value: 'LA', label: c('Country name').t`Lao People's Democratic Republic` },
    { value: 'LV', label: c('Country name').t`Latvia` },
    { value: 'LB', label: c('Country name').t`Lebanon` },
    { value: 'LS', label: c('Country name').t`Lesotho` },
    { value: 'LR', label: c('Country name').t`Liberia` },
    { value: 'LY', label: c('Country name').t`Libyan Arab Jamahiriya` },
    { value: 'LI', label: c('Country name').t`Liechtenstein` },
    { value: 'LT', label: c('Country name').t`Lithuania` },
    { value: 'LU', label: c('Country name').t`Luxembourg` },
    { value: 'MO', label: c('Country name').t`Macao` },
    { value: 'MK', label: c('Country name').t`Macedonia` },
    { value: 'MG', label: c('Country name').t`Madagascar` },
    { value: 'MW', label: c('Country name').t`Malawi` },
    { value: 'MY', label: c('Country name').t`Malaysia` },
    { value: 'MV', label: c('Country name').t`Maldives` },
    { value: 'ML', label: c('Country name').t`Mali` },
    { value: 'MT', label: c('Country name').t`Malta` },
    { value: 'MH', label: c('Country name').t`Marshall Islands` },
    { value: 'MQ', label: c('Country name').t`Martinique` },
    { value: 'MR', label: c('Country name').t`Mauritania` },
    { value: 'MU', label: c('Country name').t`Mauritius` },
    { value: 'YT', label: c('Country name').t`Mayotte` },
    { value: 'MX', label: c('Country name').t`Mexico` },
    { value: 'MD', label: c('Country name').t`Moldova` },
    { value: 'MC', label: c('Country name').t`Monaco` },
    { value: 'MN', label: c('Country name').t`Mongolia` },
    { value: 'ME', label: c('Country name').t`Montenegro` },
    { value: 'MS', label: c('Country name').t`Montserrat` },
    { value: 'MA', label: c('Country name').t`Morocco` },
    { value: 'MZ', label: c('Country name').t`Mozambique` },
    { value: 'MM', label: c('Country name').t`Myanmar` },
    { value: 'NA', label: c('Country name').t`Namibia` },
    { value: 'NR', label: c('Country name').t`Nauru` },
    { value: 'NP', label: c('Country name').t`Nepal` },
    { value: 'NL', label: c('Country name').t`Netherlands` },
    { value: 'NC', label: c('Country name').t`New Caledonia` },
    { value: 'NZ', label: c('Country name').t`New Zealand` },
    { value: 'NI', label: c('Country name').t`Nicaragua` },
    { value: 'NE', label: c('Country name').t`Niger` },
    { value: 'NG', label: c('Country name').t`Nigeria` },
    { value: 'NU', label: c('Country name').t`Niue` },
    { value: 'NF', label: c('Country name').t`Norfolk Island` },
    { value: 'NO', label: c('Country name').t`Norway` },
    { value: 'OM', label: c('Country name').t`Oman` },
    { value: 'PK', label: c('Country name').t`Pakistan` },
    { value: 'PW', label: c('Country name').t`Palau` },
    { value: 'PA', label: c('Country name').t`Panama` },
    { value: 'PG', label: c('Country name').t`Papua New Guinea` },
    { value: 'PY', label: c('Country name').t`Paraguay` },
    { value: 'PE', label: c('Country name').t`Peru` },
    { value: 'PH', label: c('Country name').t`Philippines` },
    { value: 'PN', label: c('Country name').t`Pitcairn` },
    { value: 'PL', label: c('Country name').t`Poland` },
    { value: 'PT', label: c('Country name').t`Portugal` },
    { value: 'PR', label: c('Country name').t`Puerto Rico` },
    { value: 'QA', label: c('Country name').t`Qatar` },
    { value: 'RE', label: c('Country name').t`Reunion` },
    { value: 'RO', label: c('Country name').t`Romania` },
    { value: 'RU', label: c('Country name').t`Russia` },
    { value: 'RW', label: c('Country name').t`Rwanda` },
    { value: 'SH', label: c('Country name').t`Saint Helena` },
    { value: 'KN', label: c('Country name').t`Saint Kitts and Nevis` },
    { value: 'LC', label: c('Country name').t`Saint Lucia` },
    { value: 'PM', label: c('Country name').t`Saint Pierre and Miquelon` },
    { value: 'VC', label: c('Country name').t`Saint Vincent and the Grenadines` },
    { value: 'WS', label: c('Country name').t`Samoa` },
    { value: 'SM', label: c('Country name').t`San Marino` },
    { value: 'ST', label: c('Country name').t`Sao Tome and Principe` },
    { value: 'SA', label: c('Country name').t`Saudi Arabia` },
    { value: 'SN', label: c('Country name').t`Senegal` },
    { value: 'RS', label: c('Country name').t`Serbia` },
    { value: 'SC', label: c('Country name').t`Seychelles` },
    { value: 'SL', label: c('Country name').t`Sierra Leone` },
    { value: 'SG', label: c('Country name').t`Singapore` },
    { value: 'SK', label: c('Country name').t`Slovakia` },
    { value: 'SI', label: c('Country name').t`Slovenia` },
    { value: 'SB', label: c('Country name').t`Solomon Islands` },
    { value: 'SO', label: c('Country name').t`Somalia` },
    { value: 'ZA', label: c('Country name').t`South Africa` },
    { value: 'GS', label: c('Country name').t`South Georgia and the South Sandwich Islands` },
    { value: 'SS', label: c('Country name').t`South Sudan` },
    { value: 'ES', label: c('Country name').t`Spain` },
    { value: 'LK', label: c('Country name').t`Sri Lanka` },
    { value: 'SD', label: c('Country name').t`Sudan` },
    { value: 'SR', label: c('Country name').t`Suriname` },
    { value: 'SJ', label: c('Country name').t`Svalbard and Jan Mayen` },
    { value: 'SZ', label: c('Country name').t`Swaziland` },
    { value: 'SE', label: c('Country name').t`Sweden` },
    { value: 'CH', label: c('Country name').t`Switzerland` },
    { value: 'SY', label: c('Country name').t`Syrian Arab Republic` },
    { value: 'TW', label: c('Country name').t`Taiwan` },
    { value: 'TJ', label: c('Country name').t`Tajikistan` },
    { value: 'TZ', label: c('Country name').t`Tanzania, United Republic of` },
    { value: 'TH', label: c('Country name').t`Thailand` },
    { value: 'TG', label: c('Country name').t`Togo` },
    { value: 'TK', label: c('Country name').t`Tokelau` },
    { value: 'TO', label: c('Country name').t`Tonga` },
    { value: 'TT', label: c('Country name').t`Trinidad and Tobago` },
    { value: 'TN', label: c('Country name').t`Tunisia` },
    { value: 'TR', label: c('Country name').t`Turkey` },
    { value: 'TM', label: c('Country name').t`Turkmenistan` },
    { value: 'TC', label: c('Country name').t`Turks and Caicos Islands` },
    { value: 'TV', label: c('Country name').t`Tuvalu` },
    { value: 'UG', label: c('Country name').t`Uganda` },
    { value: 'UA', label: c('Country name').t`Ukraine` },
    { value: 'AE', label: c('Country name').t`United Arab Emirates` },
    { value: 'GB', label: c('Country name').t`United Kingdom` },
    { value: 'US', label: c('Country name').t`United States` },
    { value: 'UY', label: c('Country name').t`Uruguay` },
    { value: 'UZ', label: c('Country name').t`Uzbekistan` },
    { value: 'VU', label: c('Country name').t`Vanuatu` },
    { value: 'VE', label: c('Country name').t`Venezuela` },
    { value: 'VN', label: c('Country name').t`Vietnam` },
    { value: 'WF', label: c('Country name').t`Wallis and Futuna` },
    { value: 'EH', label: c('Country name').t`Western Sahara` },
    { value: 'YE', label: c('Country name').t`Yemen` },
    { value: 'ZM', label: c('Country name').t`Zambia` },
    { value: 'ZW', label: c('Country name').t`Zimbabwe` },
];

const getSortedCountries = () => {
    const countries = getCountries();

    try {
        countries.sort((a, b) => a.label.localeCompare(b.label, localeCode.split('_').join('-')));
    } catch {}

    return countries;
};

const getCountryByAbbr = (abbr: string) => {
    const countriesByAbbr = getCountries().reduce<{ [key: string]: string }>(
        (list, country) => ({ ...list, [country.value]: country.label }),
        {}
    );

    return countriesByAbbr[abbr];
};

export const getLocalizedCountryByAbbr = (
    abbr: string,
    languageOrLanguages: string | readonly string[]
): string | undefined => {
    const [language, languages] =
        languageOrLanguages instanceof Array
            ? [languageOrLanguages[0], languageOrLanguages]
            : [languageOrLanguages, [languageOrLanguages]];

    if (!language || /^en([_-].*)?$/.test(language)) {
        return getCountryByAbbr(abbr);
    }

    const normalizedLanguages = languages.map((l) => l.replace(/_/g, '-'));

    try {
        const shortName = new Intl.DisplayNames(normalizedLanguages, { type: 'region', style: 'short' }).of(abbr);

        switch (language.split(/[_-]/)[0]) {
            case 'jp':
            case 'zh':
                return shortName || getCountryByAbbr(abbr);
        }

        const longName = new Intl.DisplayNames(normalizedLanguages, { type: 'region' }).of(abbr);

        if (shortName && longName && shortName.length < 6 && longName.length < 14) {
            return longName || getCountryByAbbr(abbr);
        }

        return shortName || getCountryByAbbr(abbr);
    } catch (e) {
        return getCountryByAbbr(abbr);
    }
};

export const correctAbbr = (abbr: string) => (abbr === 'UK' ? 'GB' : abbr);

export interface CountryItem {
    value: string;
    key: string;
    label: string;
    disabled: boolean;
    isTop?: boolean;
}

export const getFullList = (): CountryItem[] =>
    getTopCounties()
        .map(
            (country) =>
                ({
                    ...country,
                    key: `${country.value}-top`,
                    disabled: false,
                    isTop: true,
                }) as CountryItem
        )
        .concat(
            [DEFAULT_SEPARATOR],
            getSortedCountries().map((country) => ({ ...country, disabled: false, key: country.value }))
        );
export const getFirstTop = () => getTopCounties()[0];
