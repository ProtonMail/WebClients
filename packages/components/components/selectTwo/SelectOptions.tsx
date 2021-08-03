import { useContext } from 'react';
import * as React from 'react';

import { Props as OptionProps } from '../option/Option';
import { SelectChangeEvent } from './select';
import { SelectContext } from './useSelect';

interface SelectOptionsProps<V> extends Omit<React.ComponentPropsWithoutRef<'ul'>, 'onChange'> {
    selected: number | null;
    children: React.ReactElement<OptionProps<V>>[];
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

    const handleMenuKeydown = (e: React.KeyboardEvent<HTMLUListElement>) => {
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

    const items = React.Children.map(children, (child, index) => {
        return React.cloneElement(child, {
            disableFocusOnActive,
            selected: selected === index,
            active: focusedIndex === index,
            onChange: handleChildChange(index),
        });
    });

    return (
        <ul className="unstyled m0 p0" onKeyDown={handleMenuKeydown} data-testid="select-list" {...rest}>
            {items}
        </ul>
    );
};

export default SelectOptions;
