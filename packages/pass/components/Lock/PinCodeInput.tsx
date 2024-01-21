import { type VFC17, useEffect, useRef } from 'react';

import { TotpInput } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import './PinCodeInput.scss';

type Props = {
    value: string;
    loading?: boolean;
    autoFocus?: boolean;
    onValue: (value: string) => void;
};

export const PinCodeInput: VFC17<Props> = ({ value, onValue, loading = false, autoFocus = true }) => {
    const focusRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) focusRef.current?.focus();
    }, [autoFocus]);

    return (
        <div className={clsx('pass-pin--input', loading && 'opacity-30 pointer-events-none')}>
            <TotpInput
                ref={focusRef}
                length={6}
                value={value}
                onValue={onValue}
                inputType="password"
                disableChange={loading}
                autoFocus={autoFocus}
            />
        </div>
    );
};
