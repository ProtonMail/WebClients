import { ReactNode } from 'react';

import InputTwo from './Input';

const getIsValidValue = (value: string, type: TotpInputProps['type']) => {
    if (type === 'number') {
        return /[0-9]/.test(value);
    }
    return /[0-9A-Za-z]/.test(value);
};

interface TotpInputProps {
    length: number;
    value: string;
    id?: string;
    error?: ReactNode | boolean;
    onValue: (value: string) => void;
    type?: 'number' | 'alphabet';
    disableChange?: boolean;
    autoFocus?: boolean;
    autoComplete?: 'one-time-code';
}

const TotpInput = ({
    value = '',
    length,
    onValue,
    id,
    type = 'number',
    disableChange,
    autoFocus,
    autoComplete,
    error,
}: TotpInputProps) => {
    return (
        <InputTwo
            id={id}
            error={error}
            value={value}
            onChange={(event) => {
                if (disableChange) {
                    return;
                }
                const newValue = event.target.value.replaceAll(/s+/g, '');
                if (!getIsValidValue(newValue, type) && newValue !== '') {
                    return;
                }
                onValue(newValue);
            }}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            type={type === 'number' ? 'tel' : 'text'}
            inputMode={type === 'number' ? 'numeric' : undefined}
            maxLength={length}
        />
    );
};

export default TotpInput;
