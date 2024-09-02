import round from 'lodash/round';
import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmBitcoinUnit, WasmFiatCurrencySymbol, WasmNetwork } from '@proton/andromeda';
import { WasmAddress, WasmScriptType } from '@proton/andromeda';
import { BITCOIN, CENTS_BY_BITCOIN_UNIT, SATOSHI, mBITCOIN } from '@proton/wallet';

export const getLabelByUnit = (unit: WasmBitcoinUnit) => {
    switch (unit) {
        case 'BTC':
            return c('Bitcoin Unit').t`BTC`;
        case 'MBTC':
            return c('Bitcoin Unit').t`mBTC`;
        case 'SATS':
            return c('Bitcoin Unit').t`Sats`;
    }
};

export const getLabelByScriptType = (unit: WasmScriptType) => {
    switch (unit) {
        case WasmScriptType.Legacy:
            return c('Bitcoin Script Type').t`Legacy`;
        case WasmScriptType.NestedSegwit:
            return c('Bitcoin Script Type').t`Legacy Segwit`;
        case WasmScriptType.NativeSegwit:
            return c('Bitcoin Script Type').t`Native Segwit`;
        case WasmScriptType.Taproot:
            return c('Bitcoin Script Type').t`Taproot`;
    }
};

export const getDescriptionByScriptType = (unit: WasmScriptType) => {
    switch (unit) {
        case WasmScriptType.Legacy:
            return c('Bitcoin Script Type Description')
                .t`Original format. Most widely supported but higher fees. Address starts with "1".`;
        case WasmScriptType.NestedSegwit:
            return c('Bitcoin Script Type Description')
                .t`Lower fees and compatible with older systems. Address starts with "3".`;
        case WasmScriptType.NativeSegwit:
            return c('Bitcoin Script Type Description')
                .t`Recommended format with lowest fees. Address starts with "bc1q".`;
        case WasmScriptType.Taproot:
            return c('Bitcoin Script Type Description')
                .t`Latest format with enhanced privacy but not as widely adopted. Address starts with "bc1p".`;
    }
};

export const roundFloat = (value: number, decimals = 8) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
};

export const getPrecision = (unit: WasmBitcoinUnit | WasmApiExchangeRate) => {
    if (typeof unit === 'object') {
        return Math.log10(unit.Cents);
    }

    switch (unit) {
        case 'BTC':
            return 8;
        case 'MBTC':
            return 5;
        case 'SATS':
            return 0;
    }
};

/**
 * Convert and round amount to correct precision, for amount display we should prefer convertAmountStr to avoid weird numeric format
 */
export const convertAmount = (
    value: number,
    from: WasmBitcoinUnit | WasmApiExchangeRate,
    to: WasmBitcoinUnit | WasmApiExchangeRate
): number => {
    const precision = getPrecision(to);

    if (typeof from === 'object' && 'FiatCurrency' in from) {
        const valueInBitcoinUnit = value / (from.ExchangeRate / from.Cents);
        return convertAmount(valueInBitcoinUnit, from.BitcoinUnit, to);
    }

    if (typeof to === 'object' && 'FiatCurrency' in to) {
        const valueInBitcoinUnit = convertAmount(value, from, to.BitcoinUnit);
        return round(valueInBitcoinUnit * (to.ExchangeRate / to.Cents), Math.log10(to.Cents));
    }

    switch (from) {
        case 'BTC':
            switch (to) {
                case 'BTC':
                    return roundFloat(value);
                case 'MBTC':
                    return roundFloat(value * (BITCOIN / mBITCOIN), precision);
                case 'SATS':
                    return roundFloat(value * (BITCOIN / SATOSHI), precision);
            }
        case 'MBTC':
            switch (to) {
                case 'BTC':
                    return roundFloat(value / (BITCOIN / mBITCOIN));
                case 'MBTC':
                    return roundFloat(value, precision);
                case 'SATS':
                    return roundFloat(value * (mBITCOIN / SATOSHI), precision);
            }
        case 'SATS':
            switch (to) {
                case 'BTC':
                    return roundFloat(value / (BITCOIN / SATOSHI));
                case 'MBTC':
                    return roundFloat(value / (mBITCOIN / SATOSHI), precision);
                case 'SATS':
                    return roundFloat(value, precision);
            }
    }
};

export const convertAmountStr = (...args: Parameters<typeof convertAmount>) => {
    const [, , to] = args;
    const precision = getPrecision(to);
    return convertAmount(...args).toFixed(precision);
};

export const getDecimalStepByUnit = (unit: WasmBitcoinUnit | WasmApiExchangeRate) => {
    if (typeof unit === 'object') {
        return 1 / unit.Cents;
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

export const isValidBitcoinAddress = (address: string, network: WasmNetwork) => {
    try {
        new WasmAddress(address, network);
        return true;
    } catch (e) {
        return false;
    }
};

export const getBitcoinUnitOptions: () => { unit: WasmBitcoinUnit; label: string }[] = () => [
    { unit: 'BTC', label: getLabelByUnit('BTC') },
    { unit: 'MBTC', label: getLabelByUnit('MBTC') },
    { unit: 'SATS', label: getLabelByUnit('SATS') },
];

export const getExchangeRateFromBitcoinUnit = (unit: WasmBitcoinUnit): WasmApiExchangeRate => {
    const rate = {
        ID: '-1',
        BitcoinUnit: unit,
        FiatCurrency: unit as WasmFiatCurrencySymbol,
        ExchangeRateTime: '-1',
        ExchangeRate: CENTS_BY_BITCOIN_UNIT[unit],
        Cents: CENTS_BY_BITCOIN_UNIT[unit],
        isBitcoinRate: true,
    };

    // Used to distinguish from real exchange rates
    rate.isBitcoinRate = true;

    return rate;
};

export const isExchangeRateFromBitcoinUnit = (rate: WasmApiExchangeRate) => {
    return ['BTC', 'SATS', 'MBTC'].includes(rate.FiatCurrency);
};
