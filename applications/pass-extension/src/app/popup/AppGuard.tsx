import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { PasswordUnlockProvider } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { PinUnlockProvider } from '@proton/pass/components/Lock/PinUnlockProvider';
import { selectLockSetupRequired } from '@proton/pass/store/selectors';

import { usePopupContext } from './PopupProvider';
import { Lobby } from './Views/Lobby/Lobby';
import { Main } from './Views/Main';

export const AppGuard: FC = () => {
    const { initialized } = usePopupContext();
    const { authorized } = useAppState().state;
    const lockSetup = useSelector(selectLockSetupRequired);

    /* Navigate from Lobby when user is logged in (or needs lock setup),
     * and popup is initialized. In extension, `authorized` is false if
     * lock setup required (see `WorkerContextInterface::getState`). */
    const ready = (lockSetup || authorized) && initialized;

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
