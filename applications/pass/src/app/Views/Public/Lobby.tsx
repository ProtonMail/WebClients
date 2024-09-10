import { type FC, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { useAuthService } from 'proton-pass-web/app/Context/AuthServiceProvider';
import { useClient } from 'proton-pass-web/app/Context/ClientProvider';
import { c } from 'ttag';

import { useConnectivityBar } from '@proton/pass/components/Core/ConnectivityProvider';
import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { type AuthRouteState } from '@proton/pass/components/Navigation/routing';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { clientBusy, clientErrored } from '@proton/pass/lib/client';
import { AppStatus, type MaybeNull } from '@proton/pass/types';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

const app = APPS.PROTONPASS;

export const Lobby: FC = () => {
    const { SSO_URL: host } = usePassConfig();
    const client = useClient();
    const { status } = client.state;
    const authService = useAuthService();
    const history = useHistory<MaybeNull<AuthRouteState>>();

    const connectivityBar = useConnectivityBar((online) => ({
        className: clsx('bg-danger fixed bottom-0 left-0'),
        text: c('Info').t`No network connection`,
        hidden: online || clientBusy(status),
    }));

    const warning = useMemo(() => {
        const err = history.location.state?.error;
        if (err) {
            switch (err) {
                case 'fork':
                    return c('Error').t`The session has expired. Please sign in again.`;
                default:
                    return c('Error').t`Something went wrong. Please sign in again.`;
            }
        }
        if (clientErrored(status)) {
            return c('Error').t`An error occurred while resuming your session`;
        }
    }, [history.location.state, status]);

    return (
        <LobbyLayout overlay>
            <LobbyContent
                status={status}
                warning={warning}
                onLogin={(options) => {
                    if (warning) history.replace({ ...history.location, state: null });
                    return authService.init(options);
                }}
                onLogout={() => authService.logout({ soft: false })}
                onFork={() => authService.requestFork({ host, app })}
                onOffline={() => client.setStatus(AppStatus.PASSWORD_LOCKED)}
                onRegister={() => authService.requestFork({ host, app, forkType: ForkType.SIGNUP })}
                renderError={() => <></>}
            />

            {connectivityBar}
        </LobbyLayout>
    );
};
