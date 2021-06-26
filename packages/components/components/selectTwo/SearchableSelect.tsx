import React, { useState, useRef, useMemo } from 'react';
import { c } from 'ttag';
import { normalize } from '@proton/shared/lib/helpers/string';

import { Dropdown } from '../dropdown';
import { Props as OptionProps } from '../option/Option';
import { classnames } from '../../helpers';
import { SearchInput } from '../input';
import SelectButton from './SelectButton';
import SelectOptions from './SelectOptions';
import useSelect, { SelectProvider } from './useSelect';
import { SelectChangeEvent } from './select';

const includesString = (str1: string, str2: string) => normalize(str1, true).indexOf(normalize(str2, true)) > -1;

const arrayIncludesString = (arrayToSearch: string[], keyword: string) =>
    arrayToSearch.some((str) => includesString(str, keyword));

const defaultFilterFunction = <V,>(option: OptionProps<V>, keyword: string) =>
    (option.title && includesString(option.title, keyword)) ||
    (option.searchStrings && arrayIncludesString(option.searchStrings, keyword));

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
    onChange?: (e: SelectChangeEvent<V>) => void;
    onClose?: () => void;
    onOpen?: () => void;
    loading?: boolean;
    search?: boolean | ((option: OptionProps<V>) => void);
    searchPlaceholder?: string;
    noSearchResults?: string;
}

const SearchableSelect = <V extends any>({
    children,
    value,
    placeholder,
    isOpen: controlledOpen,
    onClose,
    onOpen,
    onChange,
    loading,
    search,
    searchPlaceholder,
    noSearchResults = c('Select search results').t`No results found`,
    ...rest
}: Props<V>) => {
    const [searchValue, setSearchValue] = useState('');

    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const optionValues = children.map((option) => option.props.value);

    const select = useSelect<V>({
        value,
        options: optionValues,
        numberOfItems: children.length,
        onChange,
        onClose,
        onOpen,
    });

    const { isOpen, selectedIndex, open, close: handleClose, setFocusedIndex, handleChange } = select;

    const close = (event?: React.MouseEvent<HTMLDivElement> | Event) => {
        if (event?.target instanceof Node && searchContainerRef?.current?.contains(event.target)) {
            return;
        }

        handleClose();
    };

    const focusSearchInput = () => {
        searchInputRef?.current?.focus();
    };

    const handleAnchorClick = () => {
        if (isOpen) {
            close();
        } else {
            open();
            setFocusedIndex(selectedIndex || 0);
        }
    };

    const handleClosed = () => {
        setSearchValue('');
    };

    const handleDropdownContentKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case 'Escape': {
                close();
                anchorRef.current?.focus();
                break;
            }

            default:
        }
    };

    const onSearchChange = (event: React.FormEvent<HTMLInputElement>) => {
        setSearchValue(event.currentTarget.value);

        if (!event.currentTarget.value) {
            focusSearchInput();
        }
    };

    const selectedChild = selectedIndex || selectedIndex === 0 ? children[selectedIndex] : null;

    const displayedValue = selectedChild?.props?.children || selectedChild?.props?.title || placeholder;

    const ariaLabel = selectedChild?.props?.title;

    const filteredOptions = useMemo(() => {
        if (!searchValue) {
            return children;
        }

        const filterFunction = typeof search === 'function' ? search : defaultFilterFunction;

        const filteredOptions = children.filter((child) => filterFunction(child.props, searchValue));

        return filteredOptions;
    }, [children, search, searchValue]);

    const selectedIndexInFilteredOptions =
        typeof selectedIndex === 'number'
            ? filteredOptions.findIndex((option) => children[selectedIndex] === option)
            : null;

    return (
        <SelectProvider {...select}>
            <SelectButton isOpen={isOpen} onClick={handleAnchorClick} aria-label={ariaLabel} ref={anchorRef} {...rest}>
                {displayedValue}
            </SelectButton>

            <Dropdown
                isOpen={isOpen}
                onClosed={handleClosed}
                anchorRef={anchorRef}
                onClose={close}
                offset={4}
                noCaret
                noMaxWidth
                sameAnchorWidth
                className={classnames([searchContainerRef?.current && 'dropdown--is-searchable'])}
            >
                <div onKeyDown={handleDropdownContentKeyDown}>
                    <div className="dropdown-search" ref={searchContainerRef}>
                        <SearchInput
                            autoFocus
                            ref={searchInputRef}
                            value={searchValue}
                            onInput={onSearchChange}
                            placeholder={searchPlaceholder}
                        />
                    </div>

                    {filteredOptions.length === 0 ? (
                        <div className="dropdown-search-no-result text-center">{noSearchResults}</div>
                    ) : (
                        <SelectOptions
                            disableFocusOnActive
                            selected={selectedIndexInFilteredOptions}
                            onChange={handleChange}
                        >
                            {filteredOptions}
                        </SelectOptions>
                    )}
                </div>
            </Dropdown>
        </SelectProvider>
    );
};

export default SearchableSelect;
