import { c } from 'ttag';

import { WasmApiFiatCurrency, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { Props as OptionProps } from '@proton/components/components/option/Option';

export const BITCOIN_CURRENCY = {
    ID: 'bitcoin',
    Name: 'Bitcoin',
    Symbol: 'BTC',
    Sign: '₿',
    Cents: 1,
};

export type CurrencyOption = WasmApiFiatCurrency & {
    type: 'option';
};

interface DividerOption {
    type: 'divider';
    text: string;
}

export type Option = CurrencyOption | DividerOption;

export const getIsCurrencyOption = (option: Option): option is CurrencyOption => {
    return option.type === 'option';
};

export const getSerialisedOption = (option?: WasmApiFiatCurrency) =>
    option && `${option.Name}_${option.Symbol}_${option.Sign}`.toLocaleLowerCase();

export const getAllDropdownOptions = (
    popularSymbols: WasmFiatCurrencySymbol[],
    options: WasmApiFiatCurrency[]
): Option[] => {
    // We do that to keep the order of popularSymbols
    const popularOptionsIndexes = popularSymbols
        .map((symbol) => options.findIndex((optB) => optB.Symbol === symbol))
        .filter((i) => i > -1);

    const popularOptions = popularOptionsIndexes.map((i) => options[i]);
    const otherOptions = options.filter((opt, i) => !popularOptionsIndexes.includes(i));

    return [
        { type: 'divider', text: c('Currency select').t`Popular` },
        ...popularOptions.map((opt) => ({ type: 'option', ...opt }) as Option),
        { type: 'divider', text: c('Currency select').t`Others` },
        ...[...otherOptions]
            .sort((a, b) => (a.Name < b.Name ? -1 : 1))
            .map((opt) => ({ type: 'option', ...opt }) as Option),
    ];
};

export const currencyFilterFunction = (option: OptionProps<string | undefined>, search?: string) => {
    return search && !!option.value && option.value.toLocaleLowerCase().includes(search.toLocaleLowerCase());
};
