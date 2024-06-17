import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import CorePrice, { Props as PriceOwnProps } from '@proton/components/components/price/Price';

import { convertAmount } from '../../utils';

interface Props extends Omit<PriceOwnProps, 'children' | 'currency' | 'divisor'> {
    unit: WasmBitcoinUnit | WasmApiExchangeRate;
    satsAmount: number;
}

export { CorePrice };

export const Price = ({ unit, satsAmount, ...props }: Props) => {
    const converted = convertAmount(satsAmount, 'SATS', unit);

    return (
        <CorePrice
            key={`price-${converted}`}
            divisor={1}
            currency={typeof unit === 'object' ? unit.FiatCurrency : unit}
            {...props}
        >
            {converted.toString()}
        </CorePrice>
    );
};
