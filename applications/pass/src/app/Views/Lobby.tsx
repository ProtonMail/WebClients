import { type FC, useCallback } from 'react';

import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useAuthService } from '../Context/AuthServiceProvider';
import { useClient } from '../Context/ClientProvider';

export const Lobby: FC = () => {
    const { SSO_URL } = usePassConfig();
    const client = useClient();
    const authService = useAuthService();

    const handleLogin = useCallback(() => authService.requestFork({ host: SSO_URL, app: APPS.PROTONPASS }), []);

    return (
        <LobbyLayout overlay>
            <LobbyContent
                status={client.state.status}
                onLogin={handleLogin}
                onLogout={noop}
                onRegister={noop}
                renderError={() => <></>}
            />
        </LobbyLayout>
    );
};
