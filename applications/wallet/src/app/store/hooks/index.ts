import { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store';

import { WalletDispatch, WalletState } from '../store';

export const useWalletDispatch: () => WalletDispatch = baseUseDispatch;
export const useWalletSelector: TypedUseSelectorHook<WalletState> = baseUseSelector;

export { useBitcoinNetwork, useGetBitcoinNetwork } from './useBitcoinNetwork';
export { useExchangeRate, useGetExchangeRate } from './useExchangeRate';
export { useApiWalletTransactionData, useGetApiWalletTransactionData } from './useApiWalletTransactionData';
