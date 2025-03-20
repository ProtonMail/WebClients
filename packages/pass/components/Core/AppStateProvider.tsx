import { type FC, type PropsWithChildren, createContext, useEffect, useState } from 'react';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { AppState, MaybeNull } from '@proton/pass/types';

export const AppStateContext = createContext<MaybeNull<AppState>>(null);
export const useAppState = createUseContext(AppStateContext);

export const AppStateProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState(AppStateManager.getState());
    useEffect(() => AppStateManager.subscribe(setState), []);

    return <AppStateContext.Provider value={state}>{children}</AppStateContext.Provider>;
};
