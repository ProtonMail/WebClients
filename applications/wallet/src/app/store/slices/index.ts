import { apiWalletsDataReducer } from './apiWalletsData';
import { bitcoinNetworkReducer } from './bitcoinNetwork';

export { bitcoinNetworkThunk, selectBitcoinNetwork } from './bitcoinNetwork';
export { apiWalletsDataThunk, selectApiWalletsData } from './apiWalletsData';

export const walletReducers = {
    ...bitcoinNetworkReducer,
    ...apiWalletsDataReducer,
};
