import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmApiFiatCurrency, WasmFiatCurrencySymbol } from '@proton/andromeda';
import generateUID from '@proton/atoms/generateUID';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Option from '@proton/components/components/option/Option';

import { SearchableSelect } from '../Select';
import { currencyFilterFunction, getAllDropdownOptions, getIsCurrencyOption, getSerialisedOption } from './helpers';

interface Props {
    /**
     * Popular currency options
     */
    popularSymbols?: WasmFiatCurrencySymbol[];
    /**
     * Other currency options
     */
    options: WasmApiFiatCurrency[];
    value?: WasmFiatCurrencySymbol;
    onSelect?: (value: WasmApiFiatCurrency) => void;
    error?: string;
    hint?: string;
    disabled?: boolean;

    label?: string;
    placeholder?: string;

    dense?: boolean;
}

export const CurrencySelect = ({
    popularSymbols = ['USD', 'CHF', 'EUR', 'GBP', 'CAD', 'CNY'],
    options,
    value,
    onSelect,
    error,
    hint,
    disabled,
    label,
    placeholder,
    dense,
}: Props) => {
    const [selectedCurrency, setSelectedCurrency] = useState<WasmFiatCurrencySymbol | undefined>(value);

    const detailledValue = options.find((opt) => opt.Symbol === selectedCurrency);

    const { allDropdownChildren, onlyOptions } = useMemo(() => {
        const allDropdownChildren = getAllDropdownOptions(popularSymbols, options);
        const onlyOptions = allDropdownChildren.filter(getIsCurrencyOption);

        return { allDropdownChildren, onlyOptions };
    }, [options, popularSymbols]);

    const handleSelectOption = useCallback(
        ({ value }: { value: string | undefined }) => {
            const selectedOption = onlyOptions.find((o) => getSerialisedOption(o) === value);

            if (selectedOption) {
                setSelectedCurrency(selectedOption.Symbol);
                onSelect?.(selectedOption);
            }
        },
        [onSelect, onlyOptions]
    );

    const optionsComponents = useMemo(
        () =>
            allDropdownChildren.map((option) => {
                if (option.type === 'option') {
                    return (
                        <Option key={option.ID} value={getSerialisedOption(option)} title={option.Symbol}>
                            <div className="flex flex-row items-center">
                                <span className="block mr-2">{option.Symbol}</span>
                                <span className="block color-weak">{option.Name}</span>
                            </div>
                        </Option>
                    );
                } else {
                    return (
                        <Option key={generateUID('divider')} value={null} title={option.text} disabled>
                            <span className="text-sm">{option.text}</span>
                        </Option>
                    );
                }
            }),
        [allDropdownChildren]
    );

    return (
        <SearchableSelect<string | undefined>
            id="currency-selector"
            placeholder={placeholder ?? c('Placeholder').t`Search`}
            label={dense ? '' : label ?? c('Label').t`Currency`}
            value={getSerialisedOption(detailledValue)}
            onChange={handleSelectOption}
            search={currencyFilterFunction}
            error={error}
            noSearchResults={<span className="text-bold">{c('Select search results').t`No results found`}</span>}
            hint={hint}
            data-testid="currency-selector"
            disabled={disabled}
            renderSelected={(selected) => {
                const option = onlyOptions.find((o) => getSerialisedOption(o) === selected);
                return dense ? (
                    <span className="block mr-2">{option?.Symbol}</span>
                ) : (
                    <div className="flex flex-row items-center">
                        <span className="block mr-2">{option?.Symbol}</span>
                        <span className="block color-weak">{option?.Name}</span>
                    </div>
                );
            }}
            size={{
                width: DropdownSizeUnit.Dynamic,
                maxWidth: DropdownSizeUnit.Viewport,
            }}
        >
            {optionsComponents}
        </SearchableSelect>
    );
};
