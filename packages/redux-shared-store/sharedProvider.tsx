import { type ReactNode } from 'react';
import { Provider, type TypedUseSelectorHook } from 'react-redux';

import type { Action } from '@reduxjs/toolkit';
import type { Store } from 'redux';

import { ModelThunkDispatcher } from '@proton/redux-utilities';

import { ProtonStoreContext, baseUseDispatch, baseUseSelector, baseUseStore } from './sharedContext';
import type { SharedStore } from './sharedStore';

type UseProtonDispatch = SharedStore['dispatch'];
type SharedState = ReturnType<SharedStore['getState']>;

export interface ProtonStoreProviderProps<S = any, A extends Action = Action> {
    store: Store<S, A>;
    children: ReactNode;
}

export const ProtonStoreProvider = ({ children, store }: ProtonStoreProviderProps) => {
    return (
        <Provider context={ProtonStoreContext} store={store}>
            <ModelThunkDispatcher>{children}</ModelThunkDispatcher>
        </Provider>
    );
};

export const useStore: () => SharedStore = baseUseStore;
export const useDispatch: () => UseProtonDispatch = baseUseDispatch;
export const useSelector: TypedUseSelectorHook<SharedState> = baseUseSelector;
