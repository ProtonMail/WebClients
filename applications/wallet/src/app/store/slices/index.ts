import { walletReducers as baseWalletReducers } from '@proton/wallet';

import { bitcoinNetworkReducer } from './bitcoinNetwork';

export { bitcoinNetworkThunk, selectBitcoinNetwork } from './bitcoinNetwork';

export const walletReducers = {
    ...bitcoinNetworkReducer,
    ...baseWalletReducers,
};
