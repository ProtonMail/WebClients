import { walletReducers as baseWalletReducers } from '@proton/wallet';

import { apiWalletTransactionDataReducer } from './apiWalletTransactionData';
import { bitcoinAddressHighestIndexReducer } from './bitcoinAddressHighestIndex';
import { bitcoinNetworkReducer } from './bitcoinNetwork';
import { exchangeRateReducer } from './exchangeRate';
import { fiatCurrenciesReducer } from './fiatCurrencies';

export { apiWalletTransactionDataThunk, selectApiWalletTransactionData } from './apiWalletTransactionData';
export { bitcoinAddressHighestIndexThunk, selectBitcoinAddressHighestIndex } from './bitcoinAddressHighestIndex';
export { bitcoinNetworkThunk, selectBitcoinNetwork } from './bitcoinNetwork';
export { exchangeRateThunk, selectExchangeRate } from './exchangeRate';
export { fiatCurrenciesThunk, selectSortedFiatCurrencies as selectFiatCurrencies } from './fiatCurrencies';

export const walletReducers = {
    ...bitcoinNetworkReducer,
    ...exchangeRateReducer,
    ...baseWalletReducers,
    ...apiWalletTransactionDataReducer,
    ...bitcoinAddressHighestIndexReducer,
    ...fiatCurrenciesReducer,
};
