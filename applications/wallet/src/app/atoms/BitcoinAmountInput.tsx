import { ChangeEvent } from 'react';

import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import type { InputProps } from '@proton/atoms/Input/Input';
import { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';

import { BITCOIN, mBITCOIN } from '../constants';
import { convertAmount } from '../utils';
import { CoreInput } from './Input';

interface Props extends InputFieldOwnProps, InputProps {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    value: number;
    onValueChange?: (value: number) => void;

    unit: WasmBitcoinUnit | WasmApiExchangeRate;
}

const getStepByUnit = (unit: WasmBitcoinUnit | WasmApiExchangeRate) => {
    if (typeof unit === 'object') {
        return 0.1;
    }

    switch (unit) {
        case 'BTC':
            return 1 / BITCOIN;
        case 'MBTC':
            return 1 / mBITCOIN;
        case 'SATS':
            return 1;
    }
};

export const BitcoinAmountInput = ({
    value,
    onValueChange,

    unit,
    min = 0,
    dense = true,

    inputClassName,
    ...inputProps
}: Props) => {
    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(event.target.value);
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        onValueChange?.(convertAmount(safeAmount, unit, 'SATS'));
    };

    const fValue = convertAmount(value, 'SATS', unit);
    const constrainedMin = Math.max(0, Number(min));

    return (
        <CoreInput
            dense={dense}
            type="number"
            value={fValue}
            min={constrainedMin}
            step={getStepByUnit(unit)}
            onChange={onChange}
            className="invisible-number-input-arrow"
            inputClassName={inputClassName}
            readOnly={!onValueChange}
            {...inputProps}
        />
    );
};
