import { createContext } from 'react';
import { type ReactReduxContextValue, createDispatchHook, createSelectorHook } from 'react-redux';

export const ProtonStoreContext = createContext<ReactReduxContextValue>(null as any);

export const baseUseDispatch = createDispatchHook(ProtonStoreContext);
export const baseUseSelector = createSelectorHook(ProtonStoreContext);
