import {
    RefObject,
    ReactNode,
    useCallback,
    useMemo,
    useState,
    KeyboardEvent,
    useEffect,
    useRef,
} from 'react';

import * as React from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import { sanitizeString } from '@proton/shared/lib/sanitize';

import { getMatch } from './helpers/search';
import useClickOutside from './useClickOutside';
import { classnames } from '../helpers';

// should result in an object that only has values from T that are assignable to string
type SearchableObject<T> = { [Key in KeyOfUnion<T>]: T[KeyOfUnion<T>] extends string ? T[KeyOfUnion<T>] : undefined };
type KeyOfUnion<T> = T extends any ? keyof T : never;

/**
 *useSearch hook
 *
 * @template T Type of entries, could be union
 * @param sources Array of functions returning entries
 * @param keys Array of entries' keys to search, all by default
 * @param mapFn Function that accepts a list of items collected from sources and returns a subset of that list, do sorting/filter here
 * @param highlightFn Function that accepts a string and wraps it with element you need, <mark /> by default
 * @param inputValue Search string
 * @param minSymbols Minimum symbols to start searching
 * @param resetField
 * @param onSelect
 */
function useSearch<T, K = keyof SearchableObject<T>>({
    inputValue = '',
    minSymbols = 1,
    mapFn,
    onSelect,
    onSubmit = noop,
    validate = () => true,
    resetField,
    sources,
    keys,
    highlightFn = (str: string) => <mark className="is-light">{str}</mark>,
}: {
    inputValue?: string;
    minSymbols?: number;
    onSelect: (item: T) => void;
    onSubmit?: (input: string) => void;
    mapFn?: (items: SearchableObject<T>[]) => T[];
    validate?: (inputValue: string) => boolean | undefined | void;
    resetField: () => void;
    sources: ((match: string) => T[])[];
    keys?: K[];
    highlightFn?: (a1: string) => JSX.Element;
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [error, setError] = useState('');
    const [selectedSuggest, setSelectedSuggest] = useState<number>(0);
    const parentRef = useRef<HTMLDivElement>(null);
    const selectedSuggestRef = useRef<HTMLDivElement>(null);
    const [itemProps, setItemProps] = useState<({ ref: RefObject<HTMLDivElement> } | null)[]>([]);

    const searchSuggestions = useMemo(() => {
        const matchString = sanitizeString(inputValue).toLowerCase();
        if (matchString.length < minSymbols) {
            return [];
        }
        let itemList = sources.flatMap((source) => source(matchString));
        // theoretically, this is an error in types, but it's the only way to let typescript
        // typecheck keys and mapFn arguments without doing the work in runtime
        if (mapFn) {
            itemList = mapFn(itemList as unknown as SearchableObject<T>[]);
        }
        const results = itemList
            .map((item) => {
                const matchedProps: { [key in KeyOfUnion<T>]?: ReactNode } = {};
                // when keys are not defined we still pick only searchable keys
                const keyList = (keys ||
                    Object.keys(item).filter(
                        (key) => typeof item[key as KeyOfUnion<T>] === 'string'
                    )) as KeyOfUnion<T>[];
                for (const prop of keyList) {
                    const content = item[prop];
                    const match = content && typeof content === 'string' && getMatch(content, matchString, highlightFn);
                    if (match) {
                        matchedProps[prop] = match;
                    }
                }
                return { item, matchedProps };
            })
            .filter(({ matchedProps }) => Object.keys(matchedProps).length > 0)
            .map((item, key) => ({
                ...item,
                key,
                onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetField();
                    onSelect(item.item);
                },
            }));
        return results;
    }, [inputValue]);
    const totalSuggestions = searchSuggestions.length;

    useEffect(() => setSelectedSuggest(0), [searchSuggestions]);
    useEffect(() => {
        setError('');
        if (inputValue) {
            setIsFocused(true);
        }
    }, [inputValue]);
    useEffect(() => {
        setItemProps(
            searchSuggestions.map((_, index) => (index === selectedSuggest ? { ref: selectedSuggestRef } : null))
        );
    }, [selectedSuggest]);
    useEffect(() => {
        if (!isFocused) {
            return;
        }
        selectedSuggestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [itemProps, isFocused]);

    const selectNextItem = useCallback(() => {
        const newSelectedSuggest = (selectedSuggest + 1) % totalSuggestions;
        setSelectedSuggest(newSelectedSuggest);
    }, [selectedSuggest, setSelectedSuggest, totalSuggestions]);
    const selectPreviousItem = useCallback(() => {
        const newSelectedSuggest = (selectedSuggest + totalSuggestions - 1) % totalSuggestions;
        setSelectedSuggest(newSelectedSuggest);
    }, [selectedSuggest, setSelectedSuggest, totalSuggestions]);

    const trySubmit = useMemo(
        () => () => {
            try {
                // validate can implement validation through throwing or returning false
                const isValid = validate(inputValue);
                if (isValid !== false) {
                    onSubmit(inputValue);
                    resetField();
                }
            } catch ({ message }) {
                if (message) {
                    setError(message);
                }
            }
        },
        [validate, inputValue, onSubmit, resetField, setError]
    );

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            switch (event.key) {
                case 'Escape': {
                    event.preventDefault();
                    setIsFocused(false);
                    break;
                }
                case 'Enter': {
                    const firstSuggestion = searchSuggestions[selectedSuggest]?.item;
                    if (firstSuggestion) {
                        event.preventDefault();
                        onSelect(firstSuggestion);
                        resetField();
                    } else {
                        if (!inputValue) {
                            return;
                        }
                        event.preventDefault();
                        trySubmit();
                    }
                    break;
                }
                case 'Tab': {
                    if (totalSuggestions) {
                        event.preventDefault();
                        if (totalSuggestions === 1) {
                            const firstSuggestion = searchSuggestions[selectedSuggest]?.item;
                            onSelect(firstSuggestion);
                            resetField();
                        } else if (event.shiftKey) {
                            selectPreviousItem();
                        } else {
                            selectNextItem();
                        }
                    } else {
                        if (!inputValue) {
                            return;
                        }
                        event.preventDefault();
                        trySubmit();
                    }
                    break;
                }
                case 'ArrowDown': {
                    if (!totalSuggestions) {
                        return;
                    }
                    event.preventDefault();
                    selectNextItem();
                    break;
                }
                case 'ArrowUp': {
                    if (!totalSuggestions) {
                        return;
                    }
                    event.preventDefault();
                    selectPreviousItem();
                    break;
                }
                default:
            }
        },
        [selectedSuggest, setSelectedSuggest, searchSuggestions]
    );

    const onFocus = useCallback(() => setIsFocused(true), [setIsFocused]);
    useClickOutside(parentRef, () => {
        setIsFocused(false);
    });

    return {
        error,
        selectedSuggest,
        inputProps: { onKeyDown, onFocus },
        searchSuggestions,
        datalistProps: {
            className: classnames([
                'autocomplete-suggestions',
                isFocused && searchSuggestions.length > 0 ? 'autocomplete-suggestions--open' : 'no-pointer-events',
            ]),
        },
        parentProps: {
            className: classnames(['autocomplete-input relative']),
            ref: parentRef,
        },
        itemProps,
        isFocused,
    };
}

export default useSearch;
