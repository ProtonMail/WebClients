import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

import type { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import type { InputProps } from '@proton/atoms/Input/Input';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';
import { COMPUTE_BITCOIN_UNIT } from '@proton/wallet';

import { convertAmount, getDecimalStepByUnit } from '../utils';
import { CoreInput } from './Input';

interface Props extends InputFieldOwnProps, InputProps {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    value: number;
    onValueChange?: (value: number) => void;

    unit: WasmBitcoinUnit | WasmApiExchangeRate;

    min?: number;
}

export const BitcoinAmountInput = ({
    value,
    onValueChange,

    unit,
    min = 0,
    dense = true,

    inputClassName,
    ...inputProps
}: Props) => {
    const [innerAmount, setInnerAmount] = useState(0);

    useEffect(() => {
        const convertedAmount = convertAmount(value, COMPUTE_BITCOIN_UNIT, unit);
        const amount = Math.max(min, convertedAmount);
        setInnerAmount(amount);
    }, [value, unit, min]);

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const parsedAmount = parseFloat(event.target.value);
        const amount = Number.isFinite(parsedAmount) && parsedAmount > min ? parsedAmount : min;
        setInnerAmount(amount);

        onValueChange?.(convertAmount(amount, unit, COMPUTE_BITCOIN_UNIT));
    };

    return (
        <CoreInput
            dense={dense}
            type="number"
            value={innerAmount}
            min={min}
            step={getDecimalStepByUnit(unit)}
            onChange={onChange}
            className="invisible-number-input-arrow bg-norm border-none"
            inputClassName={inputClassName}
            readOnly={!onValueChange}
            {...inputProps}
        />
    );
};
