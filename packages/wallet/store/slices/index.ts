import { apiWalletsDataReducer } from './apiWalletsData';
import { bitcoinNetworkReducer } from './bitcoinNetwork';
import { userWalletSettingsReducer } from './userWalletSettings';
import { walletSettingsReducer } from './walletSettings';

export * from './apiWalletsData';
export * from './bitcoinNetwork';
export * from './walletSettings';
export * from './userWalletSettings';

export const walletReducers = {
    ...apiWalletsDataReducer,
    ...walletSettingsReducer,
    ...bitcoinNetworkReducer,
    ...userWalletSettingsReducer,
};
