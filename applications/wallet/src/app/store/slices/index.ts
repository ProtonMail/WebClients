import { walletReducers as baseWalletReducers } from '@proton/wallet';

import { apiWalletTransactionDataReducer } from './apiWalletTransactionData';
import { bitcoinNetworkReducer } from './bitcoinNetwork';
import { exchangeRateReducer } from './exchangeRate';

export { bitcoinNetworkThunk, selectBitcoinNetwork } from './bitcoinNetwork';
export { exchangeRateThunk, selectExchangeRate } from './exchangeRate';
export { apiWalletTransactionDataThunk, selectApiWalletTransactionData } from './apiWalletTransactionData';

export const walletReducers = {
    ...bitcoinNetworkReducer,
    ...exchangeRateReducer,
    ...baseWalletReducers,
    ...apiWalletTransactionDataReducer,
};
