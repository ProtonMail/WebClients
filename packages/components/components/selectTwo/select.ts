import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import { type IconName } from '@proton/components/components/icon/Icon';

import type { OptionProps } from '../option/Option';
import type { NodeOrBoolean } from '../v2/field/InputField';

export type SelectChangeEvent<V> = {
    value: V;
    selectedIndex: number;
};

export interface SelectProps<V>
    extends Omit<ComponentPropsWithoutRef<'button'>, 'value' | 'onClick' | 'onChange' | 'onKeyDown' | 'aria-label'> {
    value?: V;
    /**
     * Enable multiple mode, allowing selection of multiple values.
     * In this mode, the value prop the value prop must be an array.
     */
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
    error?: NodeOrBoolean;
    onChange?: (e: SelectChangeEvent<V>) => void;
    onValue?: (value: V) => void;
    onClose?: () => void;
    onOpen?: () => void;
    /**
     * Render function to render the displayed value inside the select's
     * anchor. If null is returned, will fall back to the internal implementation.
     */
    renderSelected?: (selected?: V) => ReactNode;
    caretIconName?: IconName;
    caretClassName?: string;
}

export function isValidMultiMode<V>(value: any, multiple: boolean): value is V & any[] {
    if (!multiple) {
        return false;
    }

    if (value !== undefined && !Array.isArray(value)) {
        /* eslint-disable-next-line no-console */
        console.warn('[SelectTwo] Incorrect usage : if using multiple mode, value must be an array');
        return false;
    }

    return true;
}
