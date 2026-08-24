import { type FC, type PropsWithChildren, createContext, useEffect, useState } from 'react';

import { createUseContext } from '../../hooks/useContextFactory';
import type { AppState, ContextBridgeApi, MaybeNull } from '../../types';
import { AppStateManager } from './AppStateManager';

export const AppStateContext = createContext<MaybeNull<AppState>>(null);
export const useAppState = createUseContext(AppStateContext);

export const AppStateProvider: FC<PropsWithChildren<{ bridge?: ContextBridgeApi }>> = ({ bridge, children }) => {
    const [state, setState] = useState(AppStateManager.getState());

    useEffect(
        () =>
            AppStateManager.subscribe((state) => {
                bridge?.setAppState(state);
                setState(state);
            }),
        []
    );

    return <AppStateContext.Provider value={state}>{children}</AppStateContext.Provider>;
};
