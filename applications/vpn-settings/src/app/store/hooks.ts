import { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store';

import { AccountDispatch, AccountState } from './store';

export const useAccountDispatch: () => AccountDispatch = baseUseDispatch;
export const useAccountSelector: TypedUseSelectorHook<AccountState> = baseUseSelector;
