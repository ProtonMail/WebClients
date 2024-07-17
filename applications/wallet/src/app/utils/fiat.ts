import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';

export const isExchangeRate = (unit: WasmBitcoinUnit | WasmApiExchangeRate): unit is WasmApiExchangeRate => {
    return !(unit === 'BTC' || unit === 'MBTC' || unit === 'SATS');
};
