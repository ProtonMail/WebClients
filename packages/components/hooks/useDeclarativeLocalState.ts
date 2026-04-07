import { useState } from 'react';

import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

/**
 * A React hook for managing state synchronized with localStorage declaratively.
 *
 * This only writes to localStorage when `setValue` is explicitly called.
 *
 * @param key - The localStorage key to read from and write to.
 * @returns A tuple containing:
 *   1. `state` - The current value from localStorage, or `undefined` if none exists.
 *   2. `setValue` - Function to update both React state and localStorage.
 *   3. `hasStoredValue` - Boolean indicating if a value existed in localStorage at initialization.
 *
 * @example
 * const [name, setName, wasNameStored] = useDeclarativeLocalStorage("username");
 *
 * if (!wasNameStored) {
 *   setName("Guest"); // explicitly persist to localStorage
 * }
 */
export const useDeclarativeLocalState = <T>(key: string) => {
    const [hasStoredValue] = useState<boolean>(() => typeof getItem(key) === 'string');
    const [state, setState] = useState<T | undefined>(() => {
        try {
            const localStorageValue = getItem(key);
            if (typeof localStorageValue !== 'string') {
                return undefined;
            }
            return JSON.parse(localStorageValue);
        } catch (e: any) {
            return undefined;
        }
    });

    const setValue = (value: T) => {
        setState(value);
        setItem(key, JSON.stringify(value));
    };

    return [state, setValue, hasStoredValue] as const;
};
