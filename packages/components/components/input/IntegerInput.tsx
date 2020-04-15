import React, { ChangeEvent } from 'react';
import Input, { Props as InputProps } from './Input';

interface Props extends Omit<InputProps, 'onChange' | 'value' | 'min' | 'max'> {
    max?: number;
    min?: number;
    value: number | string;
    onChange: (value: number | string) => void;
    step?: number;
}

/**
 * Small helper to transform a string or a number into a string
 * For other type of arguments, return undefined
 */
const toString = (x: any) => (['number', 'string'].includes(typeof x) ? '' + x : undefined);

const IntegerInput = ({ value, onChange, max, min, step, ...rest }: Props) => {
    const minStr = toString(min);
    const maxStr = toString(max);
    const stepStr = toString(step) || '1';
    const intValue = parseInt('' + value, 10);

    return (
        <Input
            step={stepStr}
            min={minStr}
            max={maxStr}
            value={value === '' || isNaN(intValue) ? '' : intValue}
            onInput={({ target, target: { value: newValue, validity } }: ChangeEvent<HTMLInputElement>) => {
                const isClear = validity.valid;
                // Prevent broken input on certain browsers since it allows to enter other characters than integer numbers
                if (newValue === '') {
                    const emptyOrOldValue = isClear ? '' : value;
                    target.value = '' + emptyOrOldValue;
                    return onChange(emptyOrOldValue);
                }
                const newIntValue = parseInt(newValue, 10);
                if (isNaN(newIntValue) || (minStr && newIntValue < +minStr) || (maxStr && newIntValue > +maxStr)) {
                    target.value = '' + intValue;
                    return;
                }
                target.value = '' + newIntValue;
                onChange(newIntValue);
            }}
            {...rest}
        />
    );
};

export default IntegerInput;
