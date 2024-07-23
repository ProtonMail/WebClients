import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiFiatCurrency, WasmBitcoinUnit } from '@proton/andromeda';
import { BITCOIN_CURRENCY, COMPUTE_BITCOIN_UNIT, SATS_CURRENCY, useUserWalletSettings } from '@proton/wallet';

import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { CoreButton } from '../../../atoms/Button';
import type { BitcoinCurrency } from '../../../atoms/CurrencySelect';
import { CurrencySelect, DEFAULT_POPULAR_SYMBOLS } from '../../../atoms/CurrencySelect';
import { Price } from '../../../atoms/Price';
import { useFiatCurrencies, useGetExchangeRate } from '../../../store/hooks';
import { convertAmountStr, getExchangeRateFromBitcoinUnit, getLabelByUnit } from '../../../utils';

interface Props {
    remainingBalance: number;

    exchangeRate?: WasmApiExchangeRate;
    onExchangeRateChange: (u: WasmApiExchangeRate) => void;

    secondaryExchangeRate?: WasmApiExchangeRate;

    onSendAll?: () => void;

    value: number;
    onAmountChange?: (v: number) => void;

    min?: number;
}

export const secondaryAmount = ({
    key,
    primaryExchangeRate,
    secondaryExchangeRate,
    value,
    settingsBitcoinUnit,
}: {
    key: string;
    primaryExchangeRate: WasmApiExchangeRate;
    secondaryExchangeRate?: WasmApiExchangeRate;
    value: number;
    settingsBitcoinUnit: WasmBitcoinUnit;
}) => {
    if ('isBitcoinRate' in primaryExchangeRate) {
        if (!secondaryExchangeRate) {
            return null;
        }

        return <Price key={key} satsAmount={value} unit={secondaryExchangeRate} />;
    }

    return (
        <>
            {convertAmountStr(value, COMPUTE_BITCOIN_UNIT, settingsBitcoinUnit)} {getLabelByUnit(settingsBitcoinUnit)}
        </>
    );
};

export const BitcoinAmountInputWithBalanceAndCurrencySelect = ({
    remainingBalance,

    exchangeRate,
    onExchangeRateChange,
    secondaryExchangeRate,

    value,
    onAmountChange,
    onSendAll,

    min = 0,
}: Props) => {
    const [currencies] = useFiatCurrencies();
    const [settings] = useUserWalletSettings();
    const getExchangeRate = useGetExchangeRate();

    const handleChange = async (currency: WasmApiFiatCurrency | BitcoinCurrency) => {
        const exchangeRate =
            'isBitcoinUnit' in currency
                ? getExchangeRateFromBitcoinUnit(currency.Symbol)
                : await getExchangeRate(currency.Symbol);

        if (exchangeRate) {
            onExchangeRateChange(exchangeRate);
        }
    };

    const exchangeRateOrBitcoinUnit = exchangeRate ?? getExchangeRateFromBitcoinUnit(settings.BitcoinUnit);
    const exchangeRateSymbolOrBitcoinUnit = exchangeRate?.FiatCurrency;

    const price = <Price key="available-amount" satsAmount={remainingBalance} unit={exchangeRateOrBitcoinUnit} />;

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
                        unit={exchangeRateOrBitcoinUnit}
                        unstyled
                        className="h1 invisible-number-input-arrow"
                        inputClassName="p-0"
                        style={{ fontSize: '3.75rem' }}
                        value={value}
                        readOnly={!onAmountChange}
                        prefix={exchangeRateSymbolOrBitcoinUnit}
                        min={min}
                    />
                </div>

                <div className="shrink-0">
                    <CurrencySelect
                        dense
                        popularSymbols={['BTC', ...DEFAULT_POPULAR_SYMBOLS]}
                        options={[BITCOIN_CURRENCY, SATS_CURRENCY, ...(currencies ?? [])]}
                        value={exchangeRateSymbolOrBitcoinUnit}
                        onSelect={(u) => handleChange(u)}
                        stackedFieldWrapper={false}
                    />
                </div>
            </div>

            <span className="block color-weak">
                {secondaryAmount({
                    key: 'amount-hint',
                    settingsBitcoinUnit: settings.BitcoinUnit,
                    secondaryExchangeRate,
                    primaryExchangeRate: exchangeRateOrBitcoinUnit,
                    value,
                })}
            </span>
        </div>
    );
};
