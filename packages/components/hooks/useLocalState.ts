import { useState, useEffect } from 'react';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const useLocalState = (defaultValue: any, key: string) => {
    const [value, setValue] = useState(() => {
        const stickyValue = getItem(key);

        return stickyValue !== null && stickyValue !== undefined ? JSON.parse(stickyValue) : defaultValue;
    });

    useEffect(() => {
        setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
};

export default useLocalState;
