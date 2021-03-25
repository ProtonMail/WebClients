import React, { useState, useRef, useEffect, useMemo } from 'react';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';

import { Dropdown } from '../dropdown';
import { Props as OptionProps } from '../option/Option';
import useControlled from '../../hooks/useControlled';
import { classnames } from '../../helpers';
import DropdownCaret from '../dropdown/DropdownCaret';
import { CircleLoader } from '../loader';

export type FakeSelectChangeEvent<V> = {
    value: V;
    selectedIndex: number;
};

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
    onChange?: (e: FakeSelectChangeEvent<V>) => void;
    onClose?: () => void;
    onOpen?: () => void;
    loading?: boolean;
}

const SelectTwo = <V extends any>({
    children,
    value,
    placeholder,
    className,
    isOpen: controlledOpen,
    onClose,
    onOpen,
    onChange: onChangeProp,
    clearSearchAfter = 500,
    getSearchableValue,
    loading,
    ...rest
}: Props<V>) => {
    const anchorRef = useRef<HTMLButtonElement | null>(null);

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const [search, setSearch] = useState('');

    const searchClearTimeout = useRef<number | undefined>(undefined);

    const [isOpen, setIsOpen] = useControlled(controlledOpen, false);

    const allOptionValues = children.map((child) => child.props.value);

    /*
     * Natural search-ability determined by whether or not all option values
     * from the passed children are strings, there's also "unnatural" search-ability
     * if the prop "getSearchableValue" is passed
     */
    const isNaturallySearchable = allOptionValues.every((child) => typeof child === 'string');

    const isSearchable = isNaturallySearchable || Boolean(getSearchableValue);

    const selectedIndex = useMemo(() => {
        const index = children.findIndex((child) => child.props.value === value);

        return index !== -1 ? index : null;
    }, [children, value]);

    useEffect(() => {
        if (!search) {
            return;
        }

        if (!isSearchable) {
            return;
        }

        window.clearTimeout(searchClearTimeout.current);

        searchClearTimeout.current = window.setTimeout(() => {
            setSearch('');
        }, clearSearchAfter);

        /*
         * either getSearchableValue is provided or the values are naturally
         * searchable meaning that they are all strings, therefore this
         * type-cast is a safe assumption here
         */
        const indexOfMatchedOption = allOptionValues.findIndex((v) =>
            (getSearchableValue?.(v) || String(v)).startsWith(search)
        );

        if (indexOfMatchedOption !== -1) {
            setFocusedIndex(indexOfMatchedOption);
        }
    }, [search]);

    const open = () => {
        onOpen?.();
        setIsOpen(true);
        setFocusedIndex(selectedIndex || 0);
    };

    const close = () => {
        onClose?.();
        setIsOpen(false);
    };

    const goToPreviousItem = () => {
        if (focusedIndex !== null && focusedIndex !== 0) {
            setFocusedIndex(focusedIndex - 1);
        }
    };

    const goToNextItem = () => {
        if (focusedIndex !== null && focusedIndex !== children.length - 1) {
            setFocusedIndex(focusedIndex + 1);
        }
    };

    const handleAnchorClick = () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    };

    const handleAnchorKeydown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        switch (e.key) {
            case ' ': {
                open();
                break;
            }

            default:
        }
    };

    const handleChange = (event: FakeSelectChangeEvent<V>) => {
        onChangeProp?.(event);
    };

    const handleMenuKeydown = (e: React.KeyboardEvent<HTMLUListElement>) => {
        switch (e.key) {
            case 'ArrowUp': {
                e.preventDefault();
                goToPreviousItem();
                break;
            }

            case 'ArrowDown': {
                e.preventDefault();
                goToNextItem();
                break;
            }

            case 'Escape': {
                close();
                anchorRef.current?.focus();
                break;
            }

            default:
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

    const handleChildChange = (index: number) => (value: V) => {
        handleChange({ value, selectedIndex: index });
    };

    const items = React.Children.map(children, (child, index) => {
        const childValue = children[index].props.value;

        const selected = isDeepEqual(childValue, value);

        return React.cloneElement(child, {
            selected,
            active: focusedIndex === index,
            onChange: handleChildChange(index),
        });
    });

    const selectedChild = selectedIndex || selectedIndex === 0 ? children[selectedIndex] : null;

    const displayedValue = selectedChild?.props?.children || selectedChild?.props?.title || placeholder;

    const ariaLabel = selectedChild?.props?.title;

    return (
        <>
            <button
                type="button"
                className={classnames([
                    'no-outline select field w100 flex flex-justify-space-between flex-align-items-center flex-nowrap',
                    className,
                ])}
                ref={anchorRef}
                onClick={handleAnchorClick}
                onKeyDown={handleAnchorKeydown}
                aria-expanded={isOpen}
                aria-busy={loading}
                aria-live="assertive"
                aria-atomic="true"
                aria-label={ariaLabel}
                {...rest}
            >
                <span className="flex-item-fluid text-ellipsis text-left">{displayedValue}</span>
                {loading ? (
                    <CircleLoader className={classnames(['flex-item-noshrink', children ? 'ml0-5' : ''])} />
                ) : (
                    <DropdownCaret
                        className={classnames(['flex-item-noshrink', children ? 'ml0-5' : ''])}
                        isOpen={isOpen}
                    />
                )}
            </button>

            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                offset={4}
                noCaret
                noMaxWidth
                sameAnchorWidth
            >
                <ul className="unstyled m0 p0" onKeyDown={handleMenuKeydown} data-testid="select-list">
                    {items}
                </ul>
            </Dropdown>
        </>
    );
};

export default SelectTwo;
