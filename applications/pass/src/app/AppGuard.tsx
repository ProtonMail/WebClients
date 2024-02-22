import { type FC } from 'react';
import { useDispatch } from 'react-redux';
import { Route } from 'react-router-dom';

import { useAuthService } from 'proton-pass-web/app/Context/AuthServiceProvider';
import { useClient } from 'proton-pass-web/app/Context/ClientProvider';

import { ConnectivityProvider } from '@proton/pass/components/Core/ConnectivityProvider';
import { api } from '@proton/pass/lib/api/api';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientOfflineLocked, clientOfflineUnlocked } from '@proton/pass/lib/client';
import { offlineResume } from '@proton/pass/store/actions';
import { ping } from '@proton/shared/lib/api/tests';

import { Lobby } from './Views/Lobby';
import { Main } from './Views/Main';

export const AppGuard: FC = () => {
    const { state } = useClient();
    const dispatch = useDispatch();
    const auth = useAuthService();

    const onPing = async () => api(ping());

    const onReconnect = () => {
        const { status } = state;
        const localID = authStore.getLocalID();

        /** if the client was offline unlocked and network connectivity
         * resumes, try to silently resume the session in the background */
        if (clientOfflineUnlocked(status)) dispatch(offlineResume(localID));
        if (clientOfflineLocked(status)) void auth.init({ retryable: false });
    };

    return (
        <ConnectivityProvider subscribe={api.subscribe} onPing={onPing} onReconnect={onReconnect}>
            <Route path="*" render={() => (state.loggedIn ? <Main /> : <Lobby />)} />
        </ConnectivityProvider>
    );
};
