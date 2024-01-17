import { c } from 'ttag';

import { WasmBitcoinUnit, WasmScriptType } from '../../pkg';
import { BITCOIN, mBITCOIN } from '../constants';

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
        case WasmBitcoinUnit.BTC:
            return c('Bitcoin Unit').t`BTC`;
        case WasmBitcoinUnit.MBTC:
            return c('Bitcoin Unit').t`mBTC`;
        case WasmBitcoinUnit.SAT:
            return c('Bitcoin Unit').t`SAT`;
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
