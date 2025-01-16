import { localeCode } from '@proton/shared/lib/i18n';

import { getCountries, getTopCounties } from '../../core/countries';

const getSortedCountries = () => {
    const countries = getCountries();

    try {
        countries.sort((a, b) => a.label.localeCompare(b.label, localeCode.split('_').join('-')));
    } catch {}

    return countries;
};

export interface CountryItem {
    value: string;
    key: string;
    label: string;
    disabled: boolean;
    isTop?: boolean;
}

export const DEFAULT_COUNTRIES_SEPARATOR = {
    label: '------------------',
    value: '',
    disabled: true,
    key: 'separator',
};

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
            [DEFAULT_COUNTRIES_SEPARATOR],
            getSortedCountries().map((country) => ({ ...country, disabled: false, key: country.value }))
        );
