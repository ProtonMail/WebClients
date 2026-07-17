import { useCallback, useEffect, useState } from 'react';

import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const EVENT_NAME = 'proton:localstate';

type CustomEventType<T> = {
    key: string;
    value: T;
};

const readValue = <T>(key: string, defaultValue: T): T => {
    try {
        const localStorageValue = getItem(key);
        if (typeof localStorageValue !== 'string') {
            return defaultValue;
        }
        return JSON.parse(localStorageValue);
    } catch (e: any) {
        return defaultValue;
    }
};

export const useLocalStateSync = <T>(defaultValue: T, key: string): [T, (value: T) => void] => {
    const [value, setValue] = useState<T>(() => readValue(key, defaultValue));

    useEffect(() => {
        // Listen to same-tab events from other components/hooks
        const handleCustomEvent = (event: CustomEventInit<CustomEventType<T>>) => {
            if (event.detail?.key === key) {
                setValue(event.detail.value);
            }
        };

        // Also listen to storage event for cross-tab sync
        const handleStorageEvent = (event: StorageEvent) => {
            if (event.key === key && event.newValue !== null) {
                setValue(JSON.parse(event.newValue));
            }
        };

        window.addEventListener('storage', handleStorageEvent);
        window.addEventListener(EVENT_NAME, handleCustomEvent);
        return () => {
            window.removeEventListener(EVENT_NAME, handleCustomEvent);
            window.removeEventListener('storage', handleStorageEvent);
        };
    }, [key]);

    const updateValue = useCallback(
        (newValue: T) => {
            setValue(newValue);
            setItem(key, JSON.stringify(newValue));

            // Trigger custom event for same-tab listeners
            window.dispatchEvent(new CustomEvent<CustomEventType<T>>(EVENT_NAME, { detail: { key, value: newValue } }));
        },
        [key]
    );

    return [value, updateValue];
};
