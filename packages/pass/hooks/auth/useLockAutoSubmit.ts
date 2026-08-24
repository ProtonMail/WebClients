import { useEffect } from 'react';

import { SESSION_LOCK_PIN_LENGTH } from '../../components/Lock/constants';
import { useDebouncedValue } from '../useDebouncedValue';
import { useStatefulRef } from '../useStatefulRef';

type UseSessionLockPinOptions = {
    onSubmit: (pin: string) => void;
};

/* Calls onSubmit when the PIN has reached the necessary length */
export const useLockAutoSubmit = (pin: string, { onSubmit }: UseSessionLockPinOptions) => {
    const value = useDebouncedValue(pin, 150);
    const onSubmitRef = useStatefulRef(onSubmit);

    useEffect(() => {
        const safePin = value.replaceAll(/\s+/g, '');
        if (safePin.length === SESSION_LOCK_PIN_LENGTH) onSubmitRef.current(value);
    }, [value]);
};
