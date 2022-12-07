import { FormEvent, KeyboardEvent, MouseEvent, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { normalize } from '@proton/shared/lib/helpers/string';

import { classnames } from '../../helpers';
import { Dropdown, DropdownSizeUnit } from '../dropdown';
import { SearchInput } from '../input';
import Option, { Props as OptionProps } from '../option/Option';
import SelectButton from './SelectButton';
import { SelectDisplayValue } from './SelectDisplayValue';
import SelectOptions from './SelectOptions';
import { SelectProps } from './select';
import useSelect, { SelectProvider } from './useSelect';

const includesString = (str1: string, str2: string) => normalize(str1, true).indexOf(normalize(str2, true)) > -1;

const arrayIncludesString = (arrayToSearch: string[], keyword: string) =>
    arrayToSearch.some((str) => includesString(str, keyword));

const defaultFilterFunction = <V,>(option: OptionProps<V>, keyword: string) =>
    (option.title && includesString(option.title, keyword)) ||
    (option.searchStrings && arrayIncludesString(option.searchStrings, keyword));

export interface Props<V> extends SelectProps<V> {
    search?: boolean | ((option: OptionProps<V>) => void);
    searchPlaceholder?: string;
    noSearchResults?: string;
}

const SearchableSelect = <V extends any>({
    multiple = false,
    children,
    value,
    placeholder,
    isOpen: controlledOpen,
    loading,
    search,
    searchPlaceholder,
    noSearchResults = c('Select search results').t`No results found`,
    onClose,
    onOpen,
    onChange,
    renderSelected,
    ...rest
}: Props<V>) => {
    const [searchValue, setSearchValue] = useState('');

    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const optionChildren = children.filter((child) => child.type === Option);
    const optionValues = optionChildren.map((option) => option.props.value);

    const select = useSelect({
        isOpen: controlledOpen,
        multiple,
        value,
        options: optionValues,
        onChange,
        onClose,
        onOpen,
    });

    const {
        isOpen,
        selectedIndexes,
        autoclose,
        open,
        close: handleClose,
        setFocusedIndex,
        handleChange,
        focusNextIndex,
        focusPreviousIndex,
        focusedIndex,
    } = select;

    const close = (event?: MouseEvent<HTMLDivElement> | Event) => {
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
            setFocusedIndex(selectedIndexes?.[0] || 0);
        }
    };

    const handleClosed = () => {
        setSearchValue('');
    };

    const handleDropdownContentKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case 'Escape': {
                close();
                anchorRef.current?.focus();
                break;
            }

            default:
        }
    };

    const onSearchChange = (event: FormEvent<HTMLInputElement>) => {
        setSearchValue(event.currentTarget.value);

        if (!event.currentTarget.value) {
            focusSearchInput();
        }
    };

    const selectedChildren = (selectedIndexes ?? []).map((i) => optionChildren[i]);
    const ariaLabel = selectedChildren?.map((child) => child.props.title).join(', ');

    const filteredOptions = useMemo(() => {
        if (!searchValue) {
            return optionChildren;
        }

        const filterFunction = typeof search === 'function' ? search : defaultFilterFunction;

        return optionChildren.filter((child) => filterFunction(child.props, searchValue));
    }, [children, search, searchValue]);

    const selectedIndexesInFilteredOptions =
        selectedIndexes
            ?.map((index) => filteredOptions.findIndex((option) => option === optionChildren[index]))
            ?.filter((idx) => idx !== -1) ?? null;

    const pressedDown = useRef(false);

    return (
        <SelectProvider {...select}>
            <SelectButton isOpen={isOpen} onClick={handleAnchorClick} aria-label={ariaLabel} ref={anchorRef} {...rest}>
                {renderSelected?.(value) ?? (
                    <SelectDisplayValue selectedChildren={selectedChildren} placeholder={placeholder} />
                )}
            </SelectButton>

            <Dropdown
                isOpen={isOpen}
                onClosed={handleClosed}
                anchorRef={anchorRef}
                onClose={close}
                autoClose={autoclose}
                offset={4}
                noCaret
                size={{ width: DropdownSizeUnit.Anchor, maxWidth: DropdownSizeUnit.Viewport }}
                disableDefaultArrowNavigation={!searchValue}
                className={classnames([
                    searchContainerRef?.current && 'dropdown--is-searchable',
                    multiple && 'select-dropdown--togglable',
                ])}
            >
                <div onKeyDown={handleDropdownContentKeyDown}>
                    <div className="dropdown-search" ref={searchContainerRef}>
                        <SearchInput
                            onKeyDown={(e) => {
                                if (searchValue) {
                                    return;
                                }

                                if (e.key === 'ArrowDown') {
                                    focusNextIndex();
                                }

                                if (e.key === 'ArrowUp') {
                                    focusPreviousIndex();
                                }

                                if (e.key === 'Tab') {
                                    handleClose();
                                }

                                if (e.key === 'Enter') {
                                    pressedDown.current = true;
                                }
                            }}
                            onKeyUp={(e) => {
                                if (searchValue) {
                                    return;
                                }

                                if (e.key === 'Enter' && pressedDown.current) {
                                    if (focusedIndex) {
                                        handleChange({
                                            value: optionValues[focusedIndex],
                                            selectedIndex: focusedIndex,
                                        });

                                        handleClose();
                                    }

                                    pressedDown.current = false;
                                }
                            }}
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
                            selected={selectedIndexesInFilteredOptions}
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
