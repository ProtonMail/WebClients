import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store';

export * from './useApiWalletsData';
export * from './useBitcoinNetwork';
export * from './useUserWalletSettings';
export * from './useWalletSettings';

export const useWalletDispatch = baseUseDispatch;
export const useWalletSelector = baseUseSelector;
