import type { VFC } from 'react';

import { ItemEffects } from 'proton-pass-extension/lib/components/Context/Items/ItemEffects';
import {
    ItemsFilteringContext,
    ItemsFilteringContextProvider,
} from 'proton-pass-extension/lib/components/Context/Items/ItemsFilteringContext';
import { NavigationContextProvider } from 'proton-pass-extension/lib/components/Context/Navigation/NavigationContext';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';

import { InviteContextProvider } from '@proton/pass/components/Invite/InviteContextProvider';
import { PasswordContextProvider } from '@proton/pass/components/PasswordGenerator/PasswordContext';
import { SpotlightContextProvider } from '@proton/pass/components/Spotlight/SpotlightContext';

import { Lobby } from './Views/Lobby/Lobby';
import { Main } from './Views/Main';

export const App: VFC = () => {
    const { state, initialized } = usePopupContext();

    /* navigate away from the `Lobby` only when the worker
     * is in a ready & logged in state and the popup context
     * is initialized (initial popup state was resolved) */
    return state.loggedIn && initialized ? (
        <NavigationContextProvider>
            <ItemsFilteringContextProvider>
                <ItemsFilteringContext.Consumer>
                    {({ setShareId }) => (
                        <InviteContextProvider onVaultCreated={setShareId}>
                            <ItemEffects />
                            <PasswordContextProvider initial={state.initial.passwordOptions}>
                                <SpotlightContextProvider>
                                    <Main />
                                </SpotlightContextProvider>
                            </PasswordContextProvider>
                        </InviteContextProvider>
                    )}
                </ItemsFilteringContext.Consumer>
            </ItemsFilteringContextProvider>
        </NavigationContextProvider>
    ) : (
        <Lobby />
    );
};
