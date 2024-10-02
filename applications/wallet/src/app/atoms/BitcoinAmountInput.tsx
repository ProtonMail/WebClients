import { type ChangeEvent, useRef } from 'react';

import type { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import type { InputProps } from '@proton/atoms';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';

import { formatNumberForDisplay, getDecimalStepByUnit, getPrecision } from '../utils';
import { CoreInput } from './Input';

interface Props extends InputFieldOwnProps, InputProps {
    /**
     * Bitcoin amount, in provided unit
     */
    value: number;
    /**
     * Change bitcoin value and returns new value
     */
    onValueChange?: (value: number) => void;

    unit: WasmBitcoinUnit | WasmApiExchangeRate;

    min?: number;
    /**
     * Account balance, in provided unit
     */
    accountBalance?: number;
}

export const BitcoinAmountInput = ({
    value,
    onValueChange,

    unit,
    dense = true,

    min,

    accountBalance,
    inputClassName,
    ...inputProps
}: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const safeMin = min ?? 0;

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        onValueChange?.(Number(event.target.value));
    };

    return (
        <CoreInput
            ref={inputRef}
            dense={dense}
            type="number"
            value={`${formatNumberForDisplay(value, getPrecision(unit))}`}
            min={safeMin}
            max={accountBalance}
            step={getDecimalStepByUnit(unit)}
            onChange={onChange}
            className="invisible-number-input-arrow bg-norm border-none"
            inputClassName={inputClassName}
            readOnly={!onValueChange}
            {...inputProps}
        />
    );
};
