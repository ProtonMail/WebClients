import type { ComponentPropsWithoutRef, KeyboardEvent, ReactElement } from 'react';
import { Children, cloneElement, isValidElement, useContext } from 'react';

import type { OptionProps } from '../option/Option';
import Option from '../option/Option';
import type { SelectChangeEvent } from './select';
import { SelectContext } from './useSelect';

interface SelectOptionsProps<V> extends Omit<ComponentPropsWithoutRef<'ul'>, 'onChange'> {
    selected: number | number[] | null;
    children: ReactElement<OptionProps<V>>[];
    disableFocusOnActive?: boolean;
    onChange: (e: SelectChangeEvent<V>) => void;
}

const SelectOptions = <V,>({
    children,
    disableFocusOnActive = false,
    selected,
    onChange,
    onKeyDown,
    ...rest
}: SelectOptionsProps<V>) => {
    const { focusedIndex, focusPreviousIndex, focusNextIndex, close } = useContext(SelectContext);

    const handleMenuKeydown = (e: KeyboardEvent<HTMLUListElement>) => {
        onKeyDown?.(e);

        switch (e.key) {
            case 'ArrowUp': {
                e.preventDefault();
                focusPreviousIndex();
                break;
            }

            case 'ArrowDown': {
                e.preventDefault();
                focusNextIndex();
                break;
            }

            case 'Escape': {
                e.preventDefault();
                close();
                break;
            }

            default:
        }
    };

    const handleChange = (event: SelectChangeEvent<V>) => {
        onChange?.(event);
    };

    const handleChildChange = (index: number) => (value: V) => {
        handleChange({ value, selectedIndex: index });
    };

    const optionIndices = Children.toArray(children).reduce<number[]>((acc, child, index) => {
        return isValidElement(child) && child.type === Option ? [...acc, index] : acc;
    }, []);

    const items = Children.map(children, (child, index) => {
        const localIndex = optionIndices.indexOf(index);
        if (optionIndices.includes(index)) {
            return cloneElement(child, {
                disableFocusOnActive: disableFocusOnActive,
                selected: Array.isArray(selected) ? selected.includes(localIndex) : selected === localIndex,
                active: focusedIndex === localIndex,
                onChange: handleChildChange(localIndex),
            });
        }

        return child;
    });

    return (
        <ul className="unstyled m-0 p-0" onKeyDown={handleMenuKeydown} data-testid="select-list" {...rest}>
            {items}
        </ul>
    );
};

export default SelectOptions;
