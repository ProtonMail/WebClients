import { useState, useCallback } from 'react';

export default function useControlled<V>(controlled: V, defaultValue?: V) {
    const isControlled = controlled !== undefined;

    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

    const setValueIfUncontrolled = useCallback((v) => {
        if (!isControlled) {
            setUncontrolledValue(v);
        }
    }, []);

    const value = isControlled ? controlled : uncontrolledValue;

    /*
     * type-cast here to ensure that this hook's return type is a tuple
     * instead of an array as typescript seems to interpret it by default
     */
    return [value, setValueIfUncontrolled] as const;
}
