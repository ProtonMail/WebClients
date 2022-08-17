import { ReactNode, createContext, useMemo, useState } from 'react';

import useControlled from '@proton/hooks/useControlled';

import { SelectChangeEvent } from './select';

interface UseSelectOptions<V> {
    multiple: boolean;
    value?: V;
    options: V[];
    isOpen?: boolean;
    onChange?: (e: SelectChangeEvent<V>) => void;
    onValue?: (value: V) => void;
    onClose?: () => void;
    onOpen?: () => void;
}

interface UseSelectOutput<V> {
    isOpen: boolean;
    focusedIndex: number | null;
    selectedIndexes: number[] | null;
    autoclose: boolean;
    open: () => void;
    close: () => void;
    setFocusedIndex: (index: number) => void;
    focusPreviousIndex: () => void;
    focusNextIndex: () => void;
    handleChange: (e: SelectChangeEvent<V>) => void;
}

const useSelect = <V,>({
    multiple,
    value,
    options,
    isOpen: controlledOpen,
    onOpen,
    onClose,
    onChange,
    onValue,
}: UseSelectOptions<V>): UseSelectOutput<V> => {
    if (multiple && value !== undefined && !Array.isArray(value)) {
        /* eslint-disable-next-line no-console */
        console.warn('[SelectTwo] Incorrect usage : if using multiple mode, value must be an array');
    }

    const [isOpen, setIsOpen] = useControlled(controlledOpen, false);

    const [focusedIndex, setFocusedIndex] = useState<UseSelectOutput<V>['focusedIndex']>(null);

    /**
     * multi mode specifics :
     * - we want to disable dropdown autoclose on click to allowing selecting multiple options
     * - if we only have a single option in multi mode, auto closing should be re-enabled
     */
    const autoclose = !multiple || options.length <= 1;

    const selectedIndexes = useMemo<number[] | null>(() => {
        if (value === undefined) {
            return null;
        }

        const indexes = [value]
            .flat()
            .map((val) => options.findIndex((option) => option === val))
            .filter((idx) => idx !== -1);

        return indexes.length > 0 ? indexes : null;
    }, [options, value]);

    const open = () => {
        setIsOpen(true);
        onOpen?.();
        setFocusedIndex(selectedIndexes?.[0] || 0);
    };

    const close = () => {
        setIsOpen(false);
        onClose?.();
    };

    const focusPreviousIndex = () => {
        if (focusedIndex !== null && focusedIndex !== 0) {
            setFocusedIndex(focusedIndex - 1);
        }
    };

    const focusNextIndex = () => {
        if (focusedIndex !== null && focusedIndex !== options.length - 1) {
            setFocusedIndex(focusedIndex + 1);
        }
    };

    const handleChange: UseSelectOutput<V>['handleChange'] = (e) => {
        const nextValue: V = (() => {
            if (multiple && value !== undefined && Array.isArray(value)) {
                const isSelected = value?.some((selectedValue) => e.value === selectedValue) ?? false;

                return (isSelected
                    ? value.filter((selectedValue) => selectedValue !== e.value)
                    : [...value, e.value]) as any as V;
            }

            return e.value;
        })();

        e.value = nextValue;
        onChange?.(e);
        onValue?.(nextValue);
    };

    return {
        open,
        close,
        isOpen: isOpen || false,
        autoclose,
        focusedIndex,
        setFocusedIndex,
        focusPreviousIndex,
        focusNextIndex,
        handleChange,
        selectedIndexes,
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
export const SelectContext = createContext({} as UseSelectOutput<any>);

interface SelectProviderProps<V> extends UseSelectOutput<V> {
    children: ReactNode;
}

export const SelectProvider = <V,>({ children, ...rest }: SelectProviderProps<V>) => {
    return <SelectContext.Provider value={rest}>{children}</SelectContext.Provider>;
};
