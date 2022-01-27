import { useState, useEffect } from 'react';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const useLocalState = <T>(defaultValue: T, key: string) => {
    const [value, setValue] = useState<T>(() => {
        try {
            const localStorageValue = getItem(key);
            if (typeof localStorageValue !== 'string') {
                return defaultValue;
            }
            return JSON.parse(localStorageValue);
        } catch (e: any) {
            return defaultValue;
        }
    });

    useEffect(() => {
        setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue] as const;
};

export default useLocalState;
