import { useEffect } from 'react';

import { useDebouncedValue } from '.';
import { SESSION_LOCK_PIN_LENGTH } from '../components/session-lock/constants';

type UseSessionLockPinOptions = {
    onSubmit: (pin: string) => void;
};

/* Calls onSubmit when the pin has reached
 * the necessary length */
export const useSessionLockPinSubmitEffect = (pin: string, { onSubmit }: UseSessionLockPinOptions) => {
    const value = useDebouncedValue(pin, 150);

    useEffect(() => {
        const safePin = value.replaceAll(/\s+/g, '');
        if (safePin.length === SESSION_LOCK_PIN_LENGTH) {
            onSubmit(value);
        }
    }, [value, onSubmit]);
};
