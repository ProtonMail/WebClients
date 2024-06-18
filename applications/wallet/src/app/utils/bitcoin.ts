import { c } from 'ttag';

import { WasmAddress, WasmApiExchangeRate, WasmBitcoinUnit, WasmNetwork, WasmScriptType } from '@proton/andromeda';

import { fiatToSats, satsToFiat } from '.';
import { BITCOIN, COMPUTE_BITCOIN_UNIT, SATOSHI, mBITCOIN } from '../constants';

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
            return c('Bitcoin Unit').t`Sats`;
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
        return convertAmount(sats, COMPUTE_BITCOIN_UNIT, to);
    }

    if (typeof to === 'object' && 'FiatCurrency' in to) {
        const sats = convertAmount(value, from, COMPUTE_BITCOIN_UNIT);
        return satsToFiat(sats, to);
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
