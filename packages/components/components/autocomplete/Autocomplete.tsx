import React, { useRef } from 'react';

import Input, { Props as InputProps } from '../input/Input';
import { Option } from '../option';
import { Marks } from '../text';
import AutocompleteList from './AutocompleteList';
import { useAutocomplete, useAutocompleteFilter } from './useAutocomplete';

export interface Props<T> extends Omit<InputProps, 'value' | 'onChange' | 'onSelect'> {
    id: string;
    value: string;
    onChange: (value: string) => void;
    onSelect: (value: T) => void;
    options: T[];
    limit?: number;
    getData: (value: T) => string;
    searchMinLength?: number;
}

const Autocomplete = <T,>({
    id,
    value,
    onChange,
    onSelect,
    options,
    limit = 20,
    searchMinLength = 0,
    getData,
    ...rest
}: Props<T>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useAutocompleteFilter(value, options, getData, limit, searchMinLength);

    const handleSelect = (optionValue: T) => {
        onSelect(optionValue);
    };

    const { onClose, getOptionID, inputProps, suggestionProps } = useAutocomplete({
        id,
        options: filteredOptions,
        onSelect: handleSelect,
        input: value,
        inputRef,
    });

    const handleSelectOption = (optionValue: T) => {
        handleSelect(optionValue);
        onClose();
    };

    return (
        <>
            <Input
                {...rest}
                {...inputProps}
                containerRef={containerRef}
                ref={inputRef}
                value={value}
                onChange={(event) => {
                    onChange(event.currentTarget.value.trimStart());
                }}
                onKeyDown={(event) => {
                    if (!inputProps.onKeyDown(event)) {
                        if (event.key === 'Enter') {
                            handleSelectOption(value as any);
                            event.preventDefault();
                        }
                    }
                }}
            />
            <AutocompleteList anchorRef={containerRef.current ? containerRef : inputRef} {...suggestionProps}>
                {filteredOptions.map(({ chunks, text, option }, index) => {
                    return (
                        <Option
                            key={text}
                            id={getOptionID(index)}
                            title={text}
                            value={option}
                            disableFocusOnActive
                            onChange={handleSelectOption}
                        >
                            <Marks chunks={chunks}>{text}</Marks>
                        </Option>
                    );
                })}
            </AutocompleteList>
        </>
    );
};

export default Autocomplete;
