import { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';

import { EODispatch, EOStore, EOStoreState } from 'proton-mail/store/eo/eoStore';

export const useEOMailStore: () => EOStore = baseUseStore as any;
export const useEOMailDispatch: () => EODispatch = baseUseDispatch;
export const useEOMailSelector: TypedUseSelectorHook<EOStoreState> = baseUseSelector;
