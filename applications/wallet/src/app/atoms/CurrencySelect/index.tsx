import { uniq } from 'lodash';

import type { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import isTruthy from '@proton/utils/isTruthy';

interface Props {
    allowedUnits?: WasmBitcoinUnit[];
    exchangeRates?: WasmApiExchangeRate[];

    value: WasmBitcoinUnit | WasmApiExchangeRate;
    onChange: (value: WasmBitcoinUnit | WasmApiExchangeRate) => void;

    disabled?: boolean;
}

export const CurrencySelect = ({
    allowedUnits = ['BTC', 'MBTC', 'SATS'],
    exchangeRates,

    value,
    onChange,

    disabled,
}: Props) => {
    return (
        <>
            <SelectTwo
                id="currencySelect"
                value={value}
                onChange={(e: SelectChangeEvent<WasmBitcoinUnit | WasmApiExchangeRate>) => onChange(e.value)}
                aria-describedby="currencySelect"
                data-testid="currency-select"
                disabled={disabled}
                className="text-sm"
            >
                {[...(exchangeRates ?? []), ...uniq(allowedUnits)].filter(isTruthy).map((unitB) => {
                    const value = typeof unitB === 'object' ? unitB.FiatCurrency : unitB;

                    return (
                        <Option
                            key={value}
                            data-testid={`${value}-amount-input-unit-button`}
                            value={unitB}
                            title={value}
                            className="text-sm"
                        >
                            {value}
                        </Option>
                    );
                })}
            </SelectTwo>
        </>
    );
};
