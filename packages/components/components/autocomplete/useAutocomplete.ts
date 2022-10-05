import { KeyboardEvent, RefObject, useEffect, useMemo, useState } from 'react';

import { MatchChunk, escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import { normalize } from '@proton/shared/lib/helpers/string';

import { useHotkeys } from '../../hooks';

export interface DataWithMatches<T> {
    option: T;
    chunks: MatchChunk[];
    text: string;
}

export const useAutocompleteFilter = <V>(
    value: string,
    options: V[],
    getData: (v: V) => string,
    limit = 20,
    searchMinLength = -1
): DataWithMatches<V>[] => {
    return useMemo(() => {
        if (!Array.isArray(options)) {
            return [];
        }
        const normalizedSearchText = normalize(value, true);
        // Only begin searching after this length
        if (searchMinLength > 0 && value.length < searchMinLength) {
            return [];
        }

        const result = [];

        for (let i = 0; i < options.length; i++) {
            if (result.length === limit) {
                break;
            }

            const option = options[i];
            const text = getData(option);
            const normalizedText = normalize(text, true);
            const regex = new RegExp(escapeRegex(normalizedSearchText), 'gi');
            const chunks = getMatches(regex, normalizedText);

            if ((searchMinLength === 0 && normalizedSearchText.length === 0) || chunks.length > 0) {
                result.push({
                    text,
                    option,
                    chunks,
                });
            }
        }

        return result;
    }, [value, options, getData]);
};

interface UseAutocompleteProps<V> {
    id: string;
    onSelect: (value: V) => void;
    options: DataWithMatches<V>[];
    input: string;
    inputRef: RefObject<HTMLInputElement>;
}

export const useAutocomplete = <T>({ id, options, onSelect, input, inputRef }: UseAutocompleteProps<T>) => {
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const goToPreviousOption = () => {
        setHighlightedIndex((currentHighlightedIndex) =>
            currentHighlightedIndex === 0 ? currentHighlightedIndex : currentHighlightedIndex - 1
        );
    };

    const goToNextOption = () => {
        setHighlightedIndex((currentHighlightedIndex) =>
            currentHighlightedIndex === options.length - 1 ? currentHighlightedIndex : currentHighlightedIndex + 1
        );
    };

    const onOpen = () => {
        setIsOpen(true);
    };

    const onClose = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        /*
         * The number of items displayed in the
         * dropdown as well as which set of items is displayed is
         * prone to change as the value  of "input" changes.
         *
         * Selection preservation based on index can't be reliably dealt
         * with, hence we reset index highlighting to the first element
         * on any input change, given that it is not "0" already.
         */
        if (highlightedIndex !== 0) {
            setHighlightedIndex(0);
        }
    }, [input]);

    useHotkeys(inputRef, [
        [
            'Escape',
            (e) => {
                if (isOpen) {
                    e.preventDefault();
                    onClose();
                    e.stopPropagation();
                }
            },
        ],
    ]);

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'ArrowUp': {
                e.preventDefault();
                goToPreviousOption();
                break;
            }

            case 'ArrowDown': {
                e.preventDefault();
                goToNextOption();
                break;
            }

            case 'Tab':
            case 'Enter': {
                const value = options[highlightedIndex];
                if (value && isOpen) {
                    e.preventDefault();
                    onSelect(value.option);
                    onClose();
                    return true;
                }
                break;
            }

            default:
                onOpen();
        }
    };

    const getOptionID = (index: number) => `${id}-${index}`;

    return {
        onClose,
        getOptionID,
        suggestionProps: {
            id,
            isOpen: options.length > 0 && isOpen,
            onClose,
            highlightedIndex,
        },
        inputProps: {
            id,
            autoComplete: 'off',
            'aria-owns': id,
            'aria-activedescendant': getOptionID(highlightedIndex),
            'aria-autocomplete': 'list',
            'aria-describedby': `${id}-autocomplete-suggest-text`,
            onFocus: onOpen,
            onBlur: onClose,
            onKeyDown: handleInputKeyDown,
        },
    } as const;
};
