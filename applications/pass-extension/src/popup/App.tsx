import type { VFC } from 'react';

import { PasswordContextProvider } from './components/PasswordGenerator/PasswordContext';
import { ItemEffects } from './context/items/ItemEffects';
import { ItemsFilteringContextProvider } from './context/items/ItemsFilteringContext';
import { NavigationContextProvider } from './context/navigation/NavigationContext';
import { usePopupContext } from './hooks/usePopupContext';
import { Lobby } from './views/Lobby/Lobby';
import { Main } from './views/Main';

export const App: VFC = () => {
    const { state, initialized } = usePopupContext();

    /* navigate away from the `Lobby` only when the worker
     * is in a ready & logged in state and the popup context
     * is initialized (initial popup state was resolved) */
    return state.loggedIn && initialized ? (
        <NavigationContextProvider>
            <ItemsFilteringContextProvider>
                <ItemEffects />
                <PasswordContextProvider>
                    <Main />
                </PasswordContextProvider>
            </ItemsFilteringContextProvider>
        </NavigationContextProvider>
    ) : (
        <Lobby />
    );
};
