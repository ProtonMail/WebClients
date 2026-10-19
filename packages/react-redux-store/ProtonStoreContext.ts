import { createContext } from 'react';
import { type ReactReduxContextValue, createDispatchHook, createSelectorHook, createStoreHook } from 'react-redux';

export const ProtonStoreContext = createContext<ReactReduxContextValue | null>(null);

export const baseUseStore = createStoreHook(ProtonStoreContext);
export const baseUseDispatch = createDispatchHook(ProtonStoreContext);
export const baseUseSelector = createSelectorHook(ProtonStoreContext);
