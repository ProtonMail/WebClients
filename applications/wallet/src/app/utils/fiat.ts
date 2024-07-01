import { round } from 'lodash';

import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';

import { bitcoinToSats, satsToBitcoin } from '.';

const bitcoinToFiat = (bitcoin: number, exchangeRate: WasmApiExchangeRate) => {
    return round(bitcoin * (exchangeRate.ExchangeRate / exchangeRate.Cents), Math.log10(exchangeRate.Cents));
};

export const satsToFiat = (sats: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoinToFiat(satsToBitcoin(sats), exchangeRate);
};

export const fiatToSats = (fiat: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoinToSats(fiat / (exchangeRate.ExchangeRate / exchangeRate.Cents));
};

export const isExchangeRate = (unit: WasmBitcoinUnit | WasmApiExchangeRate): unit is WasmApiExchangeRate => {
    return !(unit === 'BTC' || unit === 'MBTC' || unit === 'SATS');
};
