import type { KeyboardEvent, MutableRefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { DropdownProps } from '@proton/components/components/dropdown/Dropdown';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import { normalize } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import Option from '../option/Option';
import SelectButton from './SelectButton';
import { SelectDisplayValue } from './SelectDisplayValue';
import SelectOptions from './SelectOptions';
import type { SelectProps } from './select';
import useSelect, { SelectProvider } from './useSelect';

export interface SelectTwoProps<V> extends SelectProps<V> {
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
    size?: DropdownProps['size'];
    originalPlacement?: PopperPlacement;
    anchorRef?: MutableRefObject<HTMLButtonElement | null>;
    getSearchableValue?: (value: V) => string;
    placeholder?: string;
    /**
     * Hides caret at the right of the input
     * suggesting user to click on the input to display the dropdown
     * example of usage: when there's only one option
     */
    noDropdownCaret?: boolean;
    dropdownClassName?: string;
}

const defaultSize = { width: DropdownSizeUnit.Anchor, maxWidth: DropdownSizeUnit.Viewport } as const;

const SelectTwo = <V extends any>({
    multiple = false,
    unstyled,
    children,
    value,
    placeholder,
    isOpen: controlledOpen,
    clearSearchAfter = 500,
    size = defaultSize,
    originalPlacement,
    anchorRef: maybeAnchorRef,
    onClose,
    onOpen,
    onChange,
    onValue,
    getSearchableValue,
    renderSelected,
    noDropdownCaret,
    caretIconName,
    caretClassName,
    dropdownClassName,
    ...rest
}: SelectTwoProps<V>) => {
    const anchorRef = useRef<HTMLButtonElement | null>(null);

    const [search, setSearch] = useState('');

    const searchClearTimeout = useRef<number | undefined>(undefined);

    const optionChildren = children.filter((child) => child.type === Option);
    const optionValues = optionChildren.map((child) => child.props.value);

    const select = useSelect({
        isOpen: controlledOpen,
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
            optionChildren.every((child) => typeof child.props.children === 'string'),
            optionChildren.every((child) => Boolean(child.props.title)),
        ],
        [optionChildren]
    );

    const isNaturallySearchable = allOptionChildrenAreStrings || allOptionsHaveTitles;

    const isSearchable = isNaturallySearchable || Boolean(getSearchableValue);

    const searchableItems = useMemo(() => {
        if (isNaturallySearchable) {
            return allOptionChildrenAreStrings
                ? (optionChildren.map((child) => child.props.children) as string[])
                : optionChildren.map((child) => child.props.title);
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

        const normalizedSearch = normalize(search);
        const indexOfMatchedOption = searchableItems.findIndex((v) => normalize(v).startsWith(normalizedSearch));

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
                noCaret={noDropdownCaret}
                caretIconName={caretIconName}
                caretClassName={caretClassName}
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
                size={size}
                originalPlacement={originalPlacement}
                disableDefaultArrowNavigation
                className={clsx([
                    'select-dropdown',
                    dropdownClassName,
                    allowOptionToggling && 'select-dropdown--togglable',
                ])}
            >
                <SelectOptions selected={selectedIndexes} onKeyDown={handleKeydown} onChange={handleChange}>
                    {children}
                </SelectOptions>
            </Dropdown>
        </SelectProvider>
    );
};

export default SelectTwo;
