import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';

import type { MatchChunk } from '@proton/shared/lib/helpers/regex';

import type { Props as InputProps } from '../input/Input';
import Input from '../input/Input';
import Option from '../option/Option';
import Marks from '../text/Marks';
import AutocompleteList from './AutocompleteList';
import { useAutocomplete, useAutocompleteFilter } from './useAutocomplete';

export interface Props<T> extends Omit<InputProps, 'value' | 'onChange' | 'onSelect'> {
    id: string;
    value: string;
    /**
     * Change handler for the underlying input element of the Autocomplete
     */
    onChange: (value: string) => void;
    /**
     * Select handler for a selection from the Autocomplete's dropdown
     */
    onSelect: (value: T) => void;
    options: T[];
    /**
     * Limits the number of search results that the dropdown will display.
     */
    limit?: number;
    /**
     * Maps a value from the "options" array prop to its human-readable
     * display value as well as the value used to determine source for
     * autocompletion filtering.
     */
    getData: (value: T) => string;
    /**
     * Determines the minumum number of characters from which to consider
     * an input into the autocomplete input-field as a search.
     */
    searchMinLength?: number;
    /**
     * Determines whether to show a hint that there are more results than the limit.
     */
    showHiddenResultsHint?: boolean;
    /**
     * Optional function to have a custom way to render options in the list.
     */
    renderOption?: (option: T, chunks: MatchChunk[]) => ReactNode;
    /**
     * Suggestions dropdown will have the input as anchor by default.
     * Set that ref if your want to anchor them differently.
     */
    suggestionsRef?: RefObject<HTMLElement>;
    /**
     * Additional classes to pass to the dropdown.
     */
    dropdownClassName?: string;
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
    showHiddenResultsHint = false,
    renderOption,
    suggestionsRef,
    dropdownClassName,
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

    const extraResultsCount = options.length > limit ? options.length - limit : 0;

    const anchorRef = (() => {
        if (suggestionsRef) {
            return suggestionsRef;
        } else {
            return containerRef.current ? containerRef : inputRef;
        }
    })();

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
            <AutocompleteList
                anchorRef={anchorRef}
                hiddenResultsCount={showHiddenResultsHint ? extraResultsCount : undefined}
                dropdownClassName={dropdownClassName}
                {...suggestionProps}
            >
                {filteredOptions.map(({ chunks, text, option }, index) => {
                    return (
                        <Option
                            key={getOptionID(index)}
                            id={getOptionID(index)}
                            title={text}
                            value={option}
                            disableFocusOnActive
                            onChange={handleSelectOption}
                        >
                            {renderOption ? renderOption(option, chunks) : <Marks chunks={chunks}>{text}</Marks>}
                        </Option>
                    );
                })}
            </AutocompleteList>
        </>
    );
};

export default Autocomplete;
