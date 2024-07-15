import { ChangeEvent, useEffect, useState } from 'react';

import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import type { InputProps } from '@proton/atoms/Input/Input';
import { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';
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
    const [fiatAmount, setFiatAmount] = useState(0);

    useEffect(() => {
        setFiatAmount(convertAmount(value, COMPUTE_BITCOIN_UNIT, unit));
    }, [value, unit]);

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(event.target.value);
        setFiatAmount(amount);
        const safeAmount = Number.isFinite(amount) ? amount : 0;

        onValueChange?.(convertAmount(safeAmount, unit, COMPUTE_BITCOIN_UNIT));
    };

    const constrainedMin = Math.max(0, Number(min));

    return (
        <CoreInput
            dense={dense}
            type="number"
            value={fiatAmount}
            min={constrainedMin}
            step={getDecimalStepByUnit(unit)}
            onChange={onChange}
            className="invisible-number-input-arrow bg-norm border-none"
            inputClassName={inputClassName}
            readOnly={!onValueChange}
            {...inputProps}
        />
    );
};
