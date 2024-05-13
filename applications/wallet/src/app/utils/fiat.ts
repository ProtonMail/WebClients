import { WasmApiExchangeRate } from '@proton/andromeda';

import { bitcoinToSats, satsToBitcoin } from '.';

export const bitcoinToFiat = (bitcoin: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoin * (exchangeRate.ExchangeRate / exchangeRate.Cents);
};

export const fiatToBitcoin = (fiat: number, exchangeRate: WasmApiExchangeRate) => {
    return fiat / (exchangeRate.ExchangeRate / exchangeRate.Cents);
};

export const satsToFiat = (sats: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoinToFiat(satsToBitcoin(sats), exchangeRate);
};

export const fiatToSats = (fiat: number, exchangeRate: WasmApiExchangeRate) => {
    return bitcoinToSats(fiat / (exchangeRate.ExchangeRate / exchangeRate.Cents));
};
