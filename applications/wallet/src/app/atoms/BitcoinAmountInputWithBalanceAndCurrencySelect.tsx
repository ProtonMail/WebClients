import { c } from 'ttag';

import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';

import { convertAmount } from '../utils';
import { BitcoinAmountInput } from './BitcoinAmountInput';
import { CoreButton } from './Button';
import { CurrencySelect } from './CurrencySelect';
import { Price } from './Price';

interface Props {
    exchangeRates?: WasmApiExchangeRate[];
    remainingBalance: number;

    unit: WasmBitcoinUnit | WasmApiExchangeRate;
    onUnitChange: (u: WasmBitcoinUnit | WasmApiExchangeRate) => void;

    onSendAll?: () => void;

    value: number;
    onAmountChange?: (v: number) => void;
}

export const BitcoinAmountInputWithBalanceAndCurrencySelect = ({
    exchangeRates,
    remainingBalance,
    unit,
    value,
    onUnitChange,
    onAmountChange,
    onSendAll,
}: Props) => {
    return (
        <div className="mt-12 mb-4">
            <div className="flex flex-row items-center">
                <span className="block color-hint">{c('Wallet send')
                    .jt`${(<Price key={'available-amount'} satsAmount={remainingBalance} unit={unit} />)} available`}</span>

                {onSendAll && (
                    <CoreButton
                        size="small"
                        shape="ghost"
                        color="norm"
                        className="block ml-2"
                        onClick={() => onSendAll()}
                    >
                        {c('Wallet send').t`Send all`}
                    </CoreButton>
                )}
            </div>

            <div className="flex flex-row flex-nowrap items-center justify-space-between">
                <div>
                    <BitcoinAmountInput
                        onValueChange={(v) => {
                            onAmountChange?.(v);
                        }}
                        unit={unit}
                        unstyled
                        className="h1 invisible-number-input-arrow"
                        inputClassName="p-0"
                        style={{ fontSize: '3.75rem' }}
                        value={value}
                        readOnly={!onAmountChange}
                        prefix={typeof unit === 'object' ? unit.FiatCurrency : unit}
                    />
                </div>

                <div className="no-shrink">
                    <CurrencySelect exchangeRates={exchangeRates} value={unit} onChange={(u) => onUnitChange(u)} />
                </div>
            </div>

            <span className="block color-weak">{convertAmount(value, 'SATS', 'BTC')} BTC</span>
        </div>
    );
};
