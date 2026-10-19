import type { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';

import type { WalletDispatch, WalletState } from '../store';

export const useWalletDispatch: () => WalletDispatch = baseUseDispatch;
export const useWalletSelector: TypedUseSelectorHook<WalletState> = baseUseSelector;
