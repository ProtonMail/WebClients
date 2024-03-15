import { walletReducers as baseWalletReducers } from '@proton/wallet';

import { bitcoinNetworkReducer } from './bitcoinNetwork';
import { exchangeRateReducer } from './exchangeRate';

export { bitcoinNetworkThunk, selectBitcoinNetwork } from './bitcoinNetwork';
export { exchangeRateThunk, selectExchangeRate } from './exchangeRate';

export const walletReducers = {
    ...bitcoinNetworkReducer,
    ...exchangeRateReducer,
    ...baseWalletReducers,
};
