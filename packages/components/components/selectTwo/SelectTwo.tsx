import React, { useState, useRef, useEffect, useMemo } from 'react';

import { Dropdown } from '../dropdown';
import { Props as OptionProps } from '../option/Option';
import SelectOptions from './SelectOptions';
import useSelect, { SelectProvider } from './useSelect';
import SelectButton from './SelectButton';
import { SelectChangeEvent } from './select';

export interface Props<V>
    extends Omit<
        React.ComponentPropsWithoutRef<'button'>,
        'value' | 'onClick' | 'onChange' | 'onKeyDown' | 'aria-label'
    > {
    value?: V;
    /**
     * Optionally allows controlling the Select's open state
     */
    isOpen?: boolean;
    /**
     * Children Options of the Select, have to be of type Option
     * (or something that implements the same interface)
     */
    children: React.ReactElement<OptionProps<V>>[];
    /**
     * Milliseconds after which to clear the current user input
     * (the input is used for highlighting match based on keyboard input)
     */
    clearSearchAfter?: number;
    /**
     * In case you're providing complex values to your options, you can
     * provide a function to return a string given one of your complex
     * value items. This is optional however if you do not provide it and
     * your values are complex, the search feature will be disabled for
     * that instance of the Select.
     */
    getSearchableValue?: (value: V) => string;
    loading?: boolean;
    onChange?: (e: SelectChangeEvent<V>) => void;
    onValue?: (value: V) => void;
    onClose?: () => void;
    onOpen?: () => void;
}

const SelectTwo = <V extends any>({
    children,
    value,
    placeholder,
    isOpen: controlledOpen,
    onClose,
    onOpen,
    onChange,
    onValue,
    clearSearchAfter = 500,
    getSearchableValue,
    loading,
    ...rest
}: Props<V>) => {
    const anchorRef = useRef<HTMLButtonElement | null>(null);

    const [search, setSearch] = useState('');

    const searchClearTimeout = useRef<number | undefined>(undefined);

    const allOptionValues = children.map((child) => child.props.value);

    const select = useSelect({
        value,
        options: allOptionValues,
        numberOfItems: children.length,
        onChange,
        onValue,
        onOpen,
        onClose,
    });

    const { isOpen, selectedIndex, open, close, setFocusedIndex, handleChange } = select;

    /*
     * Natural search-ability determined by whether or not all option values
     * from the passed children are strings, there's also "unnatural" search-
     * ability if the prop "getSearchableValue" is passed
     *
     * Another valid condition for the natural search-ability of the options
     * is whether or not they all have a "title" attribute
     */
    const [allOptionChildrenAreStrings, allOptionsHaveTitles] = useMemo(
        () => [
            children.every((child) => typeof child.props.children === 'string'),
            children.every((child) => Boolean(child.props.title)),
        ],
        [children]
    );

    const isNaturallySearchable = allOptionChildrenAreStrings || allOptionsHaveTitles;

    const isSearchable = isNaturallySearchable || Boolean(getSearchableValue);

    const searchableItems = useMemo(() => {
        if (isNaturallySearchable) {
            return allOptionChildrenAreStrings
                ? (children.map((child) => child.props.children) as string[])
                : children.map((child) => child.props.title);
        }

        if (getSearchableValue) {
            return allOptionValues.map(getSearchableValue);
        }

        return [];
    }, [allOptionChildrenAreStrings, children]);

    useEffect(() => {
        if (!search || !isSearchable) {
            return;
        }

        window.clearTimeout(searchClearTimeout.current);

        searchClearTimeout.current = window.setTimeout(() => {
            setSearch('');
        }, clearSearchAfter);

        const indexOfMatchedOption = searchableItems.findIndex((v) => v.startsWith(search));

        if (indexOfMatchedOption !== -1) {
            setFocusedIndex(indexOfMatchedOption);
        }
    }, [search]);

    const handleAnchorClick = () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    };

    const handleMenuKeydown = (e: React.KeyboardEvent<HTMLUListElement>) => {
        if (e.key === 'Escape') {
            close();
            anchorRef.current?.focus();
            return;
        }

        const isAlphanumeric = /^[a-z0-9]+$/i.test(e.key);

        /*
         * The e.key.length === 1 thing is super hacky and is supposed
         * to prevent event keys such as 'Shift' / 'ArrowUp' etc. from
         * being tracked here.
         *
         * A better solution might be needed.
         */
        if (isAlphanumeric && isSearchable && e.key.length === 1) {
            const { key } = e;

            setSearch((s) => s + key);
        }
    };

    const selectedChild = selectedIndex || selectedIndex === 0 ? children[selectedIndex] : null;

    const displayedValue = selectedChild?.props?.children || selectedChild?.props?.title || placeholder;

    const ariaLabel = selectedChild?.props?.title;

    return (
        <SelectProvider {...select}>
            <SelectButton
                isOpen={isOpen}
                onOpen={open}
                onClick={handleAnchorClick}
                aria-label={ariaLabel}
                ref={anchorRef}
                {...rest}
            >
                {displayedValue}
            </SelectButton>

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                offset={4}
                noCaret
                noMaxWidth
                sameAnchorWidth
                disableDefaultArrowNavigation
            >
                <SelectOptions selected={selectedIndex} onKeyDown={handleMenuKeydown} onChange={handleChange}>
                    {children}
                </SelectOptions>
            </Dropdown>
        </SelectProvider>
    );
};

export default SelectTwo;
