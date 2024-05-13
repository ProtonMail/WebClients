import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import { Price as CorePrice } from '@proton/components/components';

import { convertAmount } from '../../utils';

interface Props {
    unit: WasmBitcoinUnit | WasmApiExchangeRate;
    satsAmount: number;
}

export const Price = ({ unit, satsAmount }: Props) => {
    const strUnit = typeof unit === 'object' ? unit.FiatCurrency : unit;

    const converted = convertAmount(satsAmount, 'SATS', unit);

    if (['USD', 'EUR', 'CHF'].includes(strUnit)) {
        return (
            <CorePrice
                key={`price-${converted}`}
                divisor={1}
                currency={typeof unit === 'object' ? unit.FiatCurrency : unit}
            >
                {converted}
            </CorePrice>
        );
    }

    return `${converted} ${strUnit}`;
};
