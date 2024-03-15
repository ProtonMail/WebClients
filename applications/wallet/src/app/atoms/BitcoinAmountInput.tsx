import { ChangeEvent, useEffect, useState } from 'react';

import { uniq } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import isTruthy from '@proton/utils/isTruthy';

import { BITCOIN, mBITCOIN } from '../constants';
import { convertAmount } from '../utils';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    value: number;
    onValueChange: (value: number) => void;

    'data-testid'?: string;
    placeholder?: string;
    title?: string;
    min?: number;
    disabled?: boolean;
    suffix?: string;

    allowedUnits?: WasmBitcoinUnit[];
    exchangeRates?: WasmApiExchangeRate[];

    onMaxValue?: () => void;
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
    onMaxValue,

    allowedUnits = ['BTC', 'MBTC', 'SATS'],
    exchangeRates,

    ['data-testid']: dataTestId = 'recipient-amount-input',
    placeholder = c('Wallet').t`Amount`,
    title = c('Wallet').t`Amount`,
    min = 0,
    disabled,
}: Props) => {
    const [unit, setUnit] = useState<WasmBitcoinUnit | WasmApiExchangeRate>('SATS');
    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(event.target.value);
        onValueChange(convertAmount(amount, unit, 'SATS'));
    };

    useEffect(() => {
        if (exchangeRates?.[0]) {
            setUnit(exchangeRates[0]);
        } else {
            setUnit('SATS');
        }
    }, [exchangeRates]);

    const fValue = convertAmount(value, 'SATS', unit);

    return (
        <>
            <div className="w-custom" style={{ '--w-custom': '8rem' }}>
                <Input
                    data-testid={dataTestId}
                    placeholder={placeholder}
                    title={title}
                    type="number"
                    value={fValue}
                    min={min}
                    step={getStepByUnit(unit)}
                    disabled={disabled}
                    onChange={onChange}
                />
            </div>

            {
                <div className="ml-3 w-custom" style={{ '--w-custom': '5rem' }}>
                    <SelectTwo
                        id="currencySelect"
                        value={unit}
                        onChange={(e: SelectChangeEvent<WasmBitcoinUnit | WasmApiExchangeRate>) => setUnit(e.value)}
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
                </div>
            }

            {onMaxValue && (
                <Button className="ml-3" shape="underline" color="norm" onClick={() => onMaxValue()}>{c('Wallet Send')
                    .t`Maximum amount`}</Button>
            )}
        </>
    );
};
