import type { FC } from 'react';
import { Route, HashRouter as Router } from 'react-router-dom';

import { usePopupContext } from 'proton-pass-extension/lib/components/Context/PopupProvider';

import { Localized } from '@proton/pass/components/Core/Localized';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';

import { Lobby } from './Views/Lobby/Lobby';
import { Main } from './Views/Main';

export const App: FC = () => {
    const { state, initialized } = usePopupContext();

    /* navigate away from the `Lobby` only when the worker
     * is in a ready & logged in state and the popup context
     * is initialized (initial popup state was resolved) */
    return (
        <Localized>
            <Router>
                <NavigationProvider>
                    <Route path="*" render={() => (state.loggedIn && initialized ? <Main /> : <Lobby />)} />
                </NavigationProvider>
            </Router>
        </Localized>
    );
};
