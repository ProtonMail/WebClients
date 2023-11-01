import { useEffect, useRef } from 'react';

import { SESSION_LOCK_PIN_LENGTH } from '../components/Lock/constants';
import { useDebouncedValue } from './useDebouncedValue';

type UseSessionLockPinOptions = {
    onSubmit: (pin: string) => void;
};

/* Calls onSubmit when the PIN has reached the necessary length */
export const useSessionLockPinSubmitEffect = (pin: string, { onSubmit }: UseSessionLockPinOptions) => {
    const value = useDebouncedValue(pin, 150);
    const onSubmitRef = useRef(onSubmit);

    useEffect(() => {
        onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    useEffect(() => {
        const safePin = value.replaceAll(/\s+/g, '');
        if (safePin.length === SESSION_LOCK_PIN_LENGTH) onSubmitRef.current(value);
    }, [value]);
};
