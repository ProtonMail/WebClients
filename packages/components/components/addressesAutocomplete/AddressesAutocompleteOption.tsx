import type { ComponentPropsWithoutRef } from 'react';
import { useEffect, useRef } from 'react';

import usePrevious from '@proton/hooks/usePrevious';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import Icon from '../icon/Icon';

export interface OptionProps<V> extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onChange' | 'title'> {
    value: V;
    onChange?: (value: V) => void;
    selected?: boolean;
    active?: boolean;
    /**
     * Truncates and adds an ellipsis if the text exceeds the width of the dropdown.
     */
    truncate?: boolean;
    title: string;
    disableFocusOnActive?: boolean;
    searchStrings?: string[];
    preventScroll?: boolean;
}

const AddressesAutocompleteOption = <V,>({
    value,
    selected,
    active,
    truncate,
    onChange,
    title,
    children = title,
    disableFocusOnActive,
    searchStrings,
    className,
    preventScroll = false,
    disabled,
    ...rest
}: OptionProps<V>) => {
    const ref = useRef<HTMLButtonElement | null>(null);
    const previousActive = usePrevious(active);

    useEffect(() => {
        if (!previousActive && active) {
            if (!disableFocusOnActive) {
                ref.current?.focus({ preventScroll });
            } else {
                scrollIntoView(ref.current, { block: 'center' });
            }
        }
    }, [active]);

    const handleClick = () => {
        onChange?.(value);
    };

    return (
        <li
            className="dropdown-item"
            // @ts-expect-error - https://github.com/facebook/react/issues/17157
            inert={selected}
        >
            <button
                type="button"
                ref={ref}
                disabled={disabled}
                onClick={selected ? undefined : handleClick}
                title={title}
                className={clsx([
                    className,
                    'dropdown-item-button w-full px-4 py-2',
                    selected && 'addresses-autocomplete-option--selected color-hint',
                    'block w-full text-left',
                    active && !selected && 'active',
                    truncate ? 'text-ellipsis' : 'text-break',
                ])}
                {...rest}
            >
                <div className="flex items-center flex-nowrap">
                    <span className="flex-1 text-ellipsis">{children}</span>
                    {selected && <Icon name="checkmark-circle-filled" className="color-primary" />}
                </div>
            </button>
        </li>
    );
};

export default AddressesAutocompleteOption;
