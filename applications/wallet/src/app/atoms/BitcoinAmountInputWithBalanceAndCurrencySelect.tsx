import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiFiatCurrency, WasmBitcoinUnit } from '@proton/andromeda';
import { BITCOIN_CURRENCY, COMPUTE_BITCOIN_UNIT, SATS_CURRENCY, useUserWalletSettings } from '@proton/wallet';

import { useFiatCurrencies, useGetExchangeRate } from '../store/hooks';
import { convertAmountStr, getExchangeRateFromBitcoinUnit, getLabelByUnit, isExchangeRate } from '../utils';
import { BitcoinAmountInput } from './BitcoinAmountInput';
import { CoreButton } from './Button';
import { BitcoinCurrency, CurrencySelect, DEFAULT_POPULAR_SYMBOLS } from './CurrencySelect';
import { Price } from './Price';

interface Props {
    remainingBalance: number;

    exchangeRate?: WasmApiExchangeRate;
    onExchangeRateChange: (u: WasmApiExchangeRate) => void;

    secondaryExchangeRate?: WasmApiExchangeRate;

    onSendAll?: () => void;

    value: number;
    onAmountChange?: (v: number) => void;
}

export const secondaryAmount = ({
    key,
    exchangeRateOrBitcoinUnit,
    secondaryExchangeRate,
    value,
    settingsBitcoinUnit,
}: {
    key: string;
    exchangeRateOrBitcoinUnit: WasmApiExchangeRate | WasmBitcoinUnit;
    secondaryExchangeRate?: WasmApiExchangeRate;
    value: number;
    settingsBitcoinUnit: WasmBitcoinUnit;
}) => {
    if (!isExchangeRate(exchangeRateOrBitcoinUnit)) {
        return null;
    }

    if (
        (['BTC', 'SATS', 'MBTC'] as WasmBitcoinUnit[]).includes(
            exchangeRateOrBitcoinUnit.FiatCurrency as WasmBitcoinUnit
        )
    ) {
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

    const exchangeRateOrBitcoinUnit = exchangeRate ?? settings.BitcoinUnit;
    const exchangeRateSymbolOrBitcoinUnit = exchangeRate?.FiatCurrency ?? settings.BitcoinUnit;

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
                    exchangeRateOrBitcoinUnit,
                    value,
                })}
            </span>
        </div>
    );
};
