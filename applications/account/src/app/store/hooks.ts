import type { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';

import type { AccountDispatch, AccountState } from './store';

export const useAccountDispatch: () => AccountDispatch = baseUseDispatch;
export const useAccountSelector: TypedUseSelectorHook<AccountState> = baseUseSelector;
