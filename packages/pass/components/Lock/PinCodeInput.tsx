import { type FC, useEffect, useRef } from 'react';

import { TotpInput } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './PinCodeInput.scss';

type Props = {
    autoFocus?: boolean;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
    value: string;
    onValue: (value: string) => void;
};

export const PinCodeInput: FC<Props> = ({ autoFocus = true, className, disabled, loading = false, value, onValue }) => {
    const focusRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) focusRef.current?.focus();
        if (loading || disabled) focusRef.current?.blur();
    }, [autoFocus, loading]);

    return (
        <div className={clsx('pass-pin--input', className, (loading || disabled) && 'opacity-30 pointer-events-none')}>
            <TotpInput
                ref={focusRef}
                length={6}
                value={value}
                onValue={onValue}
                inputType="password"
                disableChange={disabled || loading}
                autoFocus={autoFocus}
            />
        </div>
    );
};
