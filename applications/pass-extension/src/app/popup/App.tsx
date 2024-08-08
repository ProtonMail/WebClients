import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Route, HashRouter as Router } from 'react-router-dom';

import { usePopupContext } from 'proton-pass-extension/lib/components/Context/PopupProvider';

import { Localized } from '@proton/pass/components/Core/Localized';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { NavigationProvider } from '@proton/pass/components/Navigation/NavigationProvider';
import { selectLockSetupRequired } from '@proton/pass/store/selectors';

import { Lobby } from './Views/Lobby/Lobby';
import { Main } from './Views/Main';

export const App: FC = () => {
    const { initialized, state } = usePopupContext();
    const lockSetup = useSelector(selectLockSetupRequired);

    /* Navigate from Lobby when user is logged in (or needs lock setup),
     * and popup is initialized. In extension, `loggedIn` is false if
     * lock setup required (see `WorkerContextInterface::getState`). */
    const ready = (lockSetup || state.loggedIn) && initialized;

    return (
        <Localized>
            <Router>
                <NavigationProvider>
                    <Route
                        path="*"
                        render={() =>
                            ready ? (
                                <PasswordUnlockProvider>
                                    <PinUnlockProvider>
                                        <Main />
                                    </PinUnlockProvider>
                                </PasswordUnlockProvider>
                            ) : (
                                <Lobby />
                            )
                        }
                    />
                </NavigationProvider>
            </Router>
        </Localized>
    );
};
