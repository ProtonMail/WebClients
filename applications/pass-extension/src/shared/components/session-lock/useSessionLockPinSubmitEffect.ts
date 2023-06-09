import { useEffect } from 'react';

import { SESSION_LOCK_PIN_LENGTH } from './constants';

type UseSessionLockPinOptions = {
    onSubmit: (pin: string) => void;
};

/**
 * Calls onSubmit when the pin has reached
 * the necessary length
 */
export const useSessionLockPinSubmitEffect = (pin: string, { onSubmit }: UseSessionLockPinOptions) => {
    useEffect(() => {
        const safePin = pin.replaceAll(/\s+/g, '');
        if (safePin.length === SESSION_LOCK_PIN_LENGTH) {
            onSubmit(pin);
        }
    }, [pin, onSubmit]);
};
