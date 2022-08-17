import { ComponentPropsWithoutRef, ReactElement } from 'react';

import { Props as OptionProps } from '../option/Option';

export type SelectChangeEvent<V> = {
    value: V;
    selectedIndex: number;
};

export interface SelectProps<V>
    extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onClick' | 'onChange' | 'onKeyDown' | 'aria-label'> {
    value?: V;
    multiple?: boolean;
    /**
     * Optionally allows controlling the Select's open state
     */
    isOpen?: boolean;
    /**
     * Children Options of the Select, have to be of type Option
     * (or something that implements the same interface)
     */
    children: ReactElement<OptionProps<V>>[];
    loading?: boolean;
    onChange?: (e: SelectChangeEvent<V>) => void;
    onValue?: (value: V) => void;
    onClose?: () => void;
    onOpen?: () => void;
    renderSelected?: (selected?: V) => ReactElement;
}
