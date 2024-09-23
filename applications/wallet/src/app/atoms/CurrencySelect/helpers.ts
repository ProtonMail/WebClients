import { c } from 'ttag';

import type { OptionProps } from '@proton/components/components/option/Option';

type CurrencyOption<S extends string, T extends { Symbol: S; Name: string }> = T & {
    type: 'option';
};

interface DividerOption {
    type: 'divider';
    text: string;
}

type Option<S extends string, T extends { Symbol: S; Name: string }> = CurrencyOption<S, T> | DividerOption;

export const getIsCurrencyOption = <S extends string, T extends { Symbol: S; Name: string }>(
    option: Option<S, T>
): option is CurrencyOption<S, T> => {
    return option.type === 'option';
};

export const getSerialisedOption = <S extends string, T extends { Symbol: S; Name: string }>(option?: T) =>
    option && `${option.Name}_${option.Symbol}`.toLocaleLowerCase();

export const getAllDropdownOptions = <S extends string, T extends { Symbol: S; Name: string }>(
    popularSymbols: S[],
    options: T[]
): Option<S, T>[] => {
    // We do that to keep the order of popularSymbols
    const popularOptionsIndexes = popularSymbols
        .map((symbol) => options.findIndex((optB) => optB.Symbol === symbol))
        .filter((i) => i > -1);

    const popularOptions = popularOptionsIndexes.map((i) => options[i]);
    const otherOptions = options.filter((opt, i) => !popularOptionsIndexes.includes(i));

    return [
        { type: 'divider', text: c('Currency select').t`Popular` },
        ...popularOptions.map((opt) => ({ type: 'option', ...opt }) as Option<S, T>),
        { type: 'divider', text: c('Currency select').t`Others` },
        ...[...otherOptions]
            .sort((a, b) => (a.Name < b.Name ? -1 : 1))
            .map((opt) => ({ type: 'option', ...opt }) as Option<S, T>),
    ];
};

export const currencyFilterFunction = (option: OptionProps<string | undefined>, search?: string) => {
    return search && !!option.value && option.value.toLocaleLowerCase().includes(search.toLocaleLowerCase());
};
