import { useCallback, useRef } from 'react';

import { Input, type InputProps } from '@proton/atoms';
import AutocompleteList from '@proton/components/components/autocomplete/AutocompleteList';
import { useAutocomplete, useAutocompleteFilter } from '@proton/components/components/autocomplete/useAutocomplete';
import Option from '@proton/components/components/option/Option';
import Marks from '@proton/components/components/text/Marks';

interface AutoCompleteItem {
    label: string;
    value: string;
}

export interface ContactEmailInputAutocompleteProps
    extends Omit<InputProps, 'type' | 'value' | 'onValue' | 'onChange'> {
    onValue: (value: string) => void;
    value: string;
    options: AutoCompleteItem[];
}

const ContactEmailInputAutocomplete = ({ options, value, onValue, ...rest }: ContactEmailInputAutocompleteProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSelectOption = useCallback((value: AutoCompleteItem) => {
        onValue(value.value);
    }, []);

    const getData = useCallback((value: { label: string }) => {
        return value.label;
    }, []);

    const filteredOptions = useAutocompleteFilter(value, options, getData, 5, 1);
    const { onClose, getOptionID, inputProps, suggestionProps } = useAutocomplete<AutoCompleteItem>({
        id: 'email',
        options: filteredOptions,
        onSelect: handleSelectOption,
        input: value,
        inputRef,
    });

    return (
        <>
            <Input
                containerRef={containerRef}
                ref={inputRef}
                value={value}
                onValue={onValue}
                {...rest}
                {...inputProps}
            />
            <AutocompleteList anchorRef={containerRef} {...suggestionProps}>
                {filteredOptions.map(({ chunks, text, option }, index) => {
                    return (
                        <Option
                            key={getOptionID(index)}
                            id={getOptionID(index)}
                            title={text}
                            value={option}
                            disableFocusOnActive
                            onChange={(value) => {
                                handleSelectOption(value);
                                onClose();
                            }}
                        >
                            <Marks chunks={chunks}>{text}</Marks>
                        </Option>
                    );
                })}
            </AutocompleteList>
        </>
    );
};

export default ContactEmailInputAutocomplete;
