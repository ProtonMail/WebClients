import { type ChangeEvent, useRef } from 'react';

import type { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import type { InputProps } from '@proton/atoms/Input/Input';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';
import { COMPUTE_BITCOIN_UNIT } from '@proton/wallet';

import { convertAmount, getDecimalStepByUnit, getPrecision } from '../utils';
import { CoreInput } from './Input';

interface Props extends InputFieldOwnProps, InputProps {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    value: number;
    /**
     * Change bitcoin value and returns new value
     */
    onValueChange?: (value: number) => void;

    unit: WasmBitcoinUnit | WasmApiExchangeRate;

    min?: number;

    accountBalance?: number;
}

const formatNumberForDisplay = (num: number, decimalPlaces: number) => {
    // Use a multiplier to shift the decimal point
    let multiplier = Math.pow(10, decimalPlaces);
    // Format the number without scientific notation
    return Math.round(num * multiplier) / multiplier;
};

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
    const amount = Math.max(safeMin, convertAmount(value, COMPUTE_BITCOIN_UNIT, unit));
    const accountBalanceAmount = accountBalance ? convertAmount(accountBalance, COMPUTE_BITCOIN_UNIT, unit) : undefined;

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const parsedAmount = parseFloat(event.target.value.replace(/^0+(\d+)/, '$1'));
        const updatedAmount = Number.isFinite(parsedAmount) && parsedAmount > safeMin ? parsedAmount : safeMin;
        if (accountBalanceAmount && updatedAmount > accountBalanceAmount) {
            onValueChange?.(convertAmount(accountBalanceAmount, unit, COMPUTE_BITCOIN_UNIT));
        } else {
            onValueChange?.(convertAmount(updatedAmount, unit, COMPUTE_BITCOIN_UNIT));
        }
    };

    return (
        <CoreInput
            ref={inputRef}
            dense={dense}
            type="number"
            value={formatNumberForDisplay(amount, getPrecision(unit))}
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
