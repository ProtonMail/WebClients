import type { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';

import type { EODispatch, EOStore, EOStoreState } from './eoStore';

export const useEOMailStore: () => EOStore = baseUseStore as any;
export const useEOMailDispatch: () => EODispatch = baseUseDispatch;
export const useEOMailSelector: TypedUseSelectorHook<EOStoreState> = baseUseSelector;
