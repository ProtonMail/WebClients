import { WasmApiExchangeRate } from '@proton/andromeda';

import { bitcoinToSats, satsToBitcoin } from '.';
import { CENTS_IN_ONE_DOLLAR } from '../constants';

export const bitcoinToFiat = (bitcoin: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoin * (exchangeRate.ExchangeRate / CENTS_IN_ONE_DOLLAR);
};

export const fiatToBitcoin = (fiat: number, exchangeRate: WasmApiExchangeRate) => {
    return fiat / (exchangeRate.ExchangeRate / CENTS_IN_ONE_DOLLAR);
};

export const satsToFiat = (sats: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoinToFiat(satsToBitcoin(sats), exchangeRate);
};

export const fiatToSats = (fiat: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoinToSats(fiat / (exchangeRate.ExchangeRate / CENTS_IN_ONE_DOLLAR));
};

