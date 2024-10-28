import type { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import { COMPUTE_BITCOIN_UNIT } from '@proton/wallet';

import { Price } from '../../../atoms/Price';
import { convertAmount, convertAmountStr, getLabelByUnit } from '../../../utils';

export const SecondaryAmount = ({
    key,
    primaryExchangeRate,
    secondaryExchangeRate,
    value,
    settingsBitcoinUnit,
}: {
    key: string;
    primaryExchangeRate: WasmApiExchangeRate;
    secondaryExchangeRate?: WasmApiExchangeRate;
    /**
     * Value in provided primary exchange rate
     */
    value: number;
    settingsBitcoinUnit: WasmBitcoinUnit;
}) => {
    if ('isBitcoinRate' in primaryExchangeRate) {
        if (!secondaryExchangeRate) {
            return null;
        }

        return (
            <Price
                key={key}
                amount={convertAmount(value, primaryExchangeRate, COMPUTE_BITCOIN_UNIT)}
                unit={secondaryExchangeRate}
            />
        );
    }

    return (
        <>
            {convertAmountStr(value, primaryExchangeRate, settingsBitcoinUnit)} {getLabelByUnit(settingsBitcoinUnit)}
        </>
    );
};
