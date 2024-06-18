import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiFiatCurrency } from '@proton/andromeda';

import { COMPUTE_BITCOIN_UNIT } from '../constants';
import { useFiatCurrencies, useGetExchangeRate } from '../store/hooks';
import { useUserWalletSettings } from '../store/hooks/useUserWalletSettings';
import { convertAmount, getLabelByUnit } from '../utils';
import { BitcoinAmountInput } from './BitcoinAmountInput';
import { CoreButton } from './Button';
import { CurrencySelect } from './CurrencySelect';
import { Price } from './Price';

interface Props {
    remainingBalance: number;

    exchangeRate?: WasmApiExchangeRate;
    onExchangeRateChange: (u?: WasmApiExchangeRate) => void;

    onSendAll?: () => void;

    value: number;
    onAmountChange?: (v: number) => void;
}

export const BitcoinAmountInputWithBalanceAndCurrencySelect = ({
    remainingBalance,
    exchangeRate,
    value,
    onExchangeRateChange,
    onAmountChange,
    onSendAll,
}: Props) => {
    const [currencies] = useFiatCurrencies();
    const [settings] = useUserWalletSettings();
    const getExchangeRate = useGetExchangeRate();

    const handleChange = async (currency?: WasmApiFiatCurrency) => {
        if (currency) {
            const exchangeRate = await getExchangeRate(currency.Symbol);
            if (exchangeRate) {
                onExchangeRateChange(exchangeRate);
            }
        } else {
            onExchangeRateChange();
        }
    };

    const price = (
        <Price key={'available-amount'} satsAmount={remainingBalance} unit={exchangeRate ?? settings.BitcoinUnit} />
    );

    return (
        <div className="mt-12 mb-4">
            <div className="flex flex-row items-center">
                <span className="block color-hint">{c('Wallet send').jt`${price} available`}</span>

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
                        unit={exchangeRate ?? settings.BitcoinUnit}
                        unstyled
                        className="h1 invisible-number-input-arrow"
                        inputClassName="p-0"
                        style={{ fontSize: '3.75rem' }}
                        value={value}
                        readOnly={!onAmountChange}
                        prefix={exchangeRate?.FiatCurrency}
                    />
                </div>

                <div className="no-shrink">
                    <CurrencySelect
                        dense
                        options={currencies ?? []}
                        value={exchangeRate?.FiatCurrency}
                        onSelect={(u) => handleChange(u)}
                    />
                </div>
            </div>

            {!!exchangeRate && (
                <span className="block color-weak">
                    {convertAmount(value, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                    {getLabelByUnit(settings.BitcoinUnit)}
                </span>
            )}
        </div>
    );
};
