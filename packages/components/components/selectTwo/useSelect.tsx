import { useMemo, useState } from 'react';
import * as React from 'react';

import useControlled from '../../hooks/useControlled';
import { SelectChangeEvent } from './select';

interface UseSelectOptions<V> {
    value?: V;
    options: V[];
    isOpen?: boolean;
    numberOfItems: number;
    onChange?: (e: SelectChangeEvent<V>) => void;
    onValue?: (value: V) => void;
    onClose?: () => void;
    onOpen?: () => void;
}

interface UseSelectOutput<V> {
    isOpen: boolean;
    focusedIndex: number | null;
    selectedIndex: number | null;
    open: () => void;
    close: () => void;
    setFocusedIndex: (index: number) => void;
    focusPreviousIndex: () => void;
    focusNextIndex: () => void;
    handleChange: (e: SelectChangeEvent<V>) => void;
}

const useSelect = <V,>({
    value,
    options,
    isOpen: controlledOpen,
    numberOfItems,
    onOpen,
    onClose,
    onChange,
    onValue,
}: UseSelectOptions<V>): UseSelectOutput<V> => {
    const [isOpen, setIsOpen] = useControlled(controlledOpen, false);

    const [focusedIndex, setFocusedIndex] = useState<UseSelectOutput<V>['focusedIndex']>(null);

    const selectedIndex = useMemo(() => {
        const index = options.findIndex((option) => option === value);

        return index !== -1 ? index : null;
    }, [options, value]);

    const open = () => {
        onOpen?.();
        setIsOpen(true);
        setFocusedIndex(selectedIndex || 0);
    };

    const close = () => {
        onClose?.();
        setIsOpen(false);
    };

    const focusPreviousIndex = () => {
        if (focusedIndex !== null && focusedIndex !== 0) {
            setFocusedIndex(focusedIndex - 1);
        }
    };

    const focusNextIndex = () => {
        if (focusedIndex !== null && focusedIndex !== numberOfItems) {
            setFocusedIndex(focusedIndex + 1);
        }
    };

    const handleChange: UseSelectOutput<V>['handleChange'] = (e) => {
        onChange?.(e);
        onValue?.(e.value);
    };

    return {
        open,
        close,
        isOpen: isOpen || false,
        focusedIndex,
        setFocusedIndex,
        focusPreviousIndex,
        focusNextIndex,
        handleChange,
        selectedIndex,
    };
};

export default useSelect;

/*
 * The purpose of this provider is merely to pass the value returned from
 * useSelect down the tree for any composed children to consume.
 * As far as I'm aware there is no context provider api in pure hook fashion
 * so we have to use a component here.
 *
 * That being said, since it's really part of useSelect, less the api inconvenience,
 * I've chosen to define it inside this hook's definition file.
 */
export const SelectContext = React.createContext({} as UseSelectOutput<any>);

interface SelectProviderProps<V> extends UseSelectOutput<V> {
    children: React.ReactNode;
}

export const SelectProvider = <V,>({ children, ...rest }: SelectProviderProps<V>) => {
    return <SelectContext.Provider value={rest}>{children}</SelectContext.Provider>;
};
