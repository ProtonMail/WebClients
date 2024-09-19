import type { FormEvent, KeyboardEvent, MouseEvent, MutableRefObject, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import type { DropdownSize } from '@proton/components/components/dropdown/utils';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import SearchInput from '@proton/components/components/input/SearchInput';
import clsx from '@proton/utils/clsx';

import type { OptionProps } from '../option/Option';
import Option from '../option/Option';
import type { PopperPlacement } from '../popper';
import SelectButton from './SelectButton';
import { SelectDisplayValue } from './SelectDisplayValue';
import SelectOptions from './SelectOptions';
import { defaultFilterFunction } from './helpers';
import type { SelectProps } from './select';
import useSelect, { SelectProvider } from './useSelect';

export interface SearcheableSelectProps<V> extends SelectProps<V> {
    search?: boolean | ((option: OptionProps<V>, keyword?: string) => void);
    searchPlaceholder?: string;
    noSearchResults?: ReactNode;
    unstyled?: boolean;
    size?: DropdownSize;
    originalPlacement?: PopperPlacement;
    availablePlacements?: PopperPlacement[];
    placeholder?: string;
    dropdownClassName?: string;
    anchorRef?: MutableRefObject<HTMLButtonElement | null>;
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
    size = {
        width: DropdownSizeUnit.Anchor,
        maxWidth: DropdownSizeUnit.Viewport,
    },
    noSearchResults = c('Select search results').t`No results found`,
    onClose,
    onOpen,
    onChange,
    renderSelected,
    originalPlacement,
    availablePlacements,
    dropdownClassName,
    caretIconName,
    caretClassName,
    anchorRef: maybeAnchorRef,
    ...rest
}: SearcheableSelectProps<V>) => {
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
            <SelectButton
                isOpen={isOpen}
                onClick={handleAnchorClick}
                aria-label={ariaLabel}
                ref={anchorRef}
                caretIconName={caretIconName}
                caretClassName={caretClassName}
                {...rest}
            >
                {renderSelected?.(value) ?? (
                    <SelectDisplayValue selectedChildren={selectedChildren} placeholder={placeholder} />
                )}
            </SelectButton>

            <Dropdown
                isOpen={isOpen}
                onClosed={handleClosed}
                anchorRef={maybeAnchorRef || anchorRef}
                onClose={close}
                autoClose={autoclose}
                offset={4}
                noCaret
                size={size}
                disableDefaultArrowNavigation={!searchValue}
                originalPlacement={originalPlacement}
                availablePlacements={availablePlacements}
                className={clsx([
                    searchContainerRef?.current && 'dropdown--is-searchable',
                    multiple && 'select-dropdown--togglable',
                    dropdownClassName,
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
                                    if (focusedIndex === null) {
                                        return;
                                    }

                                    const focusedOptionComponentProps = optionChildren[focusedIndex].props;
                                    const focusedOptionValue = optionValues[focusedIndex];

                                    if (focusedOptionComponentProps.disabled === true) {
                                        return;
                                    }

                                    if (focusedOptionValue) {
                                        handleChange({
                                            value: focusedOptionValue,
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
