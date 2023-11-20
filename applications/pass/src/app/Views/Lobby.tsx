import { type FC } from 'react';

import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { APPS } from '@proton/shared/lib/constants';

import { useAuthService } from '../Context/AuthServiceProvider';
import { useClient } from '../Context/ClientProvider';

const app = APPS.PROTONPASS;

export const Lobby: FC = () => {
    const { SSO_URL: host } = usePassConfig();
    const client = useClient();
    const authService = useAuthService();

    return (
        <LobbyLayout overlay>
            <LobbyContent
                status={client.state.status}
                onLogin={() => authService.requestFork({ host, app })}
                onLogout={() => authService.logout({ soft: true })}
                onRegister={() => authService.requestFork({ host, app, type: FORK_TYPE.SIGNUP })}
                renderError={() => <></>}
            />
        </LobbyLayout>
    );
};
