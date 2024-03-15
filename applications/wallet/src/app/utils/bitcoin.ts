import { c } from 'ttag';

import { WasmApiExchangeRate, WasmBitcoinUnit, WasmScriptType } from '@proton/andromeda';

import { fiatToSats, satsToFiat } from '.';
import { BITCOIN, SATOSHI, mBITCOIN } from '../constants';

export const bitcoinToSats = (btc: number) => {
    return btc * BITCOIN;
};

export const satsToBitcoin = (sats: number) => {
    return sats / BITCOIN;
};

export const satsToMBitcoin = (sats: number) => {
    return sats / mBITCOIN;
};

export const getLabelByUnit = (unit: WasmBitcoinUnit) => {
    switch (unit) {
        case 'BTC':
            return c('Bitcoin Unit').t`BTC`;
        case 'MBTC':
            return c('Bitcoin Unit').t`mBTC`;
        case 'SATS':
            return c('Bitcoin Unit').t`SATs`;
    }
};

export const getLabelByScriptType = (unit: WasmScriptType) => {
    switch (unit) {
        case WasmScriptType.Legacy:
            return c('Bitcoin Script Type').t`Legacy`;
        case WasmScriptType.NestedSegwit:
            return c('Bitcoin Script Type').t`Nested Segwit`;
        case WasmScriptType.NativeSegwit:
            return c('Bitcoin Script Type').t`Native Segwit`;
        case WasmScriptType.Taproot:
            return c('Bitcoin Script Type').t`Taproot`;
    }
};

export const roundFloat = (value: number, decimals = 8) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
};

export const convertAmount = (
    value: number,
    from: WasmBitcoinUnit | WasmApiExchangeRate,
    to: WasmBitcoinUnit | WasmApiExchangeRate
): number => {
    if (typeof from === 'object' && 'FiatCurrency' in from) {
        const sats = fiatToSats(value, from);
        return convertAmount(sats, 'SATS', to);
    }

    if (typeof to === 'object' && 'FiatCurrency' in to) {
        const sats = convertAmount(value, from, 'SATS');
        return roundFloat(satsToFiat(sats, to), 2);
    }

    switch (from) {
        case 'BTC':
            switch (to) {
                case 'BTC':
                    return roundFloat(value);
                case 'MBTC':
                    return roundFloat(value * (BITCOIN / mBITCOIN), 5);
                case 'SATS':
                    return roundFloat(value * (BITCOIN / SATOSHI), 0);
            }
        case 'MBTC':
            switch (to) {
                case 'BTC':
                    return roundFloat(value / (BITCOIN / mBITCOIN));
                case 'MBTC':
                    return roundFloat(value, 5);
                case 'SATS':
                    return roundFloat(value * (mBITCOIN / SATOSHI), 0);
            }
        case 'SATS':
            switch (to) {
                case 'BTC':
                    return roundFloat(value / (BITCOIN / SATOSHI));
                case 'MBTC':
                    return roundFloat(value / (mBITCOIN / SATOSHI), 5);
                case 'SATS':
                    return roundFloat(value, 0);
            }
    }
};
