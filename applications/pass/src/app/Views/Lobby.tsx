import { type FC } from 'react';

import { useAuthService } from 'proton-pass-web/app/Context/AuthServiceProvider';
import { useClient } from 'proton-pass-web/app/Context/ClientProvider';
import { c } from 'ttag';

import { useConnectivityBar } from '@proton/pass/components/Core/ConnectivityProvider';
import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { clientBusy, clientErrored } from '@proton/pass/lib/client';
import { AppStatus } from '@proton/pass/types';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

const app = APPS.PROTONPASS;

export const Lobby: FC = () => {
    const { SSO_URL: host } = usePassConfig();
    const client = useClient();
    const authService = useAuthService();

    const connectivityBar = useConnectivityBar((online) => ({
        className: clsx('bg-danger fixed bottom-0 left-0'),
        text: c('Info').t`No network connection`,
        hidden: online || clientBusy(client.state.status),
    }));

    return (
        <LobbyLayout overlay>
            <LobbyContent
                status={client.state.status}
                onLogin={() =>
                    clientErrored(client.state.status)
                        ? authService.init({ forceLock: true })
                        : authService.requestFork({ host, app })
                }
                onLogout={() => authService.logout({ soft: false })}
                onOffline={() => client.setStatus(AppStatus.PASSWORD_LOCKED)}
                onRegister={() => authService.requestFork({ host, app, forkType: ForkType.SIGNUP })}
                renderError={() => <></>}
            />

            {connectivityBar}
        </LobbyLayout>
    );
};
