import { apiWalletsDataReducer } from './apiWalletsData';
import { walletSettingsReducer } from './walletSettings';

export * from './apiWalletsData';
export * from './walletSettings';

export const walletReducers = {
    ...apiWalletsDataReducer,
    ...walletSettingsReducer,
};
