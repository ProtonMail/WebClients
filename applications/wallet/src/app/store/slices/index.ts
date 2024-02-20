import { bitcoinNetworkReducer } from './bitcoinNetwork';
import { userWalletsReducer } from './userWallets';

export { bitcoinNetworkThunk, selectBitcoinNetwork } from './bitcoinNetwork';
export { userWalletsThunk, selectUserWallets } from './userWallets';

export const walletReducers = {
    ...bitcoinNetworkReducer,
    ...userWalletsReducer,
};
