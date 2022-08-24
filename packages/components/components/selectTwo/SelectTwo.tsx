import { KeyboardEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';

import { classnames } from '../..';
import { Dropdown } from '../dropdown';
import Option from '../option/Option';
import SelectButton from './SelectButton';
import { SelectDisplayValue } from './SelectDisplayValue';
import SelectOptions from './SelectOptions';
import { SelectProps } from './select';
import useSelect, { SelectProvider } from './useSelect';

export interface Props<V> extends SelectProps<V> {
    /**
     * Optionally allows to remove the border around the select. Use for example in inputs
     */
    unstyled?: boolean;
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
    noMaxWidth?: boolean;
    originalPlacement?: string;
    anchorRef?: MutableRefObject<HTMLButtonElement | null>;
    getSearchableValue?: (value: V) => string;
}

const SelectTwo = <V extends any>({
    multiple = false,
    unstyled,
    children,
    value,
    placeholder,
    isOpen: controlledOpen,
    clearSearchAfter = 500,
    noMaxWidth = true,
    originalPlacement,
    loading,
    anchorRef: maybeAnchorRef,
    onClose,
    onOpen,
    onChange,
    onValue,
    getSearchableValue,
    renderSelected,
    ...rest
}: Props<V>) => {
    const anchorRef = useRef<HTMLButtonElement | null>(null);

    const [search, setSearch] = useState('');

    const searchClearTimeout = useRef<number | undefined>(undefined);

    const optionChildren = children.filter((child) => child.type === Option);
    const optionValues = optionChildren.map((child) => child.props.value);

    const select = useSelect({
        multiple,
        value,
        options: optionValues,
        onChange,
        onValue,
        onOpen,
        onClose,
    });

    const { isOpen, selectedIndexes, autoclose, open, close, setFocusedIndex, handleChange } = select;

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
            return optionValues.map(getSearchableValue);
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
            if (isOpen) {
                setFocusedIndex(indexOfMatchedOption);
            } else {
                const matchedValue = optionValues[indexOfMatchedOption];
                onChange?.({
                    value: matchedValue,
                    selectedIndex: indexOfMatchedOption,
                });
                onValue?.(matchedValue);
            }
        }
    }, [search]);

    const handleAnchorClick = () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    };

    const handleKeydown = (e: KeyboardEvent<HTMLElement>) => {
        const { key } = e;

        if (key === 'Escape') {
            close();
            anchorRef.current?.focus();
            return;
        }

        if (key === ' ') {
            open();
            return;
        }

        const isAlphanumeric = /^[A-Za-z0-9]$/.test(key);

        if (isAlphanumeric && isSearchable) {
            setSearch((s) => s + key);
        }
    };

    const selectedChildren = (selectedIndexes ?? []).map((i) => optionChildren[i]);
    const ariaLabel = selectedChildren?.map((child) => child.props.title).join(', ');

    const allowOptionToggling = multiple && optionChildren.length > 1;

    return (
        <SelectProvider {...select}>
            <SelectButton
                unstyled={unstyled}
                isOpen={isOpen}
                onOpen={open}
                onClick={handleAnchorClick}
                onKeyDown={handleKeydown}
                aria-label={ariaLabel}
                ref={anchorRef}
                {...rest}
            >
                {renderSelected?.(value) ?? (
                    <SelectDisplayValue selectedChildren={selectedChildren} placeholder={placeholder} />
                )}
            </SelectButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={maybeAnchorRef || anchorRef}
                onClose={close}
                autoClose={autoclose}
                offset={4}
                noCaret
                noMaxWidth={noMaxWidth}
                originalPlacement={originalPlacement}
                sameAnchorWidth
                disableDefaultArrowNavigation
                className={classnames(['select-dropdown', allowOptionToggling && 'select-dropdown--togglable'])}
            >
                <SelectOptions selected={selectedIndexes} onKeyDown={handleKeydown} onChange={handleChange}>
                    {children}
                </SelectOptions>
            </Dropdown>
        </SelectProvider>
    );
};

export default SelectTwo;
