import type { ForwardRefRenderFunction } from 'react';
import { forwardRef, useEffect, useRef } from 'react';

import TotpInput from '@proton/components/components/v2/input/TotpInput';
import useCombinedRefs from '@proton/hooks/useCombinedRefs';
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

const PinCodeInputRender: ForwardRefRenderFunction<HTMLInputElement, Props> = (
    { autoFocus = true, className, disabled, loading = false, value, onValue },
    ref
) => {
    const focusRef = useRef<HTMLInputElement>(null);
    const combinedRef = useCombinedRefs(focusRef, ref);

    useEffect(() => {
        if (autoFocus) focusRef.current?.focus();
        if (loading || disabled) focusRef.current?.blur();
    }, [autoFocus, loading]);

    return (
        <div className={clsx('pass-pin--input', className, (loading || disabled) && 'opacity-30 pointer-events-none')}>
            <TotpInput
                ref={combinedRef}
                length={6}
                value={value}
                onValue={onValue}
                inputType="password"
                disableChange={disabled || loading}
                autoFocus={autoFocus}
                data-protonpass-ignore={true}
            />
        </div>
    );
};

export const PinCodeInput = forwardRef(PinCodeInputRender);
