import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';

import { usePopupContext } from 'proton-pass-extension/lib/components/Context/PopupProvider';

import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { selectLockSetupRequired } from '@proton/pass/store/selectors';

import { Lobby } from './Views/Lobby/Lobby';
import { Main } from './Views/Main';

export const AppGuard: FC = () => {
    const { initialized, state } = usePopupContext();
    const lockSetup = useSelector(selectLockSetupRequired);

    /* Navigate from Lobby when user is logged in (or needs lock setup),
     * and popup is initialized. In extension, `loggedIn` is false if
     * lock setup required (see `WorkerContextInterface::getState`). */
    const ready = (lockSetup || state.loggedIn) && initialized;

    return (
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
    );
};
