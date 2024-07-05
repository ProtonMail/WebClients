import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';

export * from './useApiWalletsData';
export * from './useBitcoinNetwork';
export * from './useUserWalletSettings';
export * from './useWalletSettings';

export const useWalletDispatch = baseUseDispatch;
export const useWalletSelector = baseUseSelector;
