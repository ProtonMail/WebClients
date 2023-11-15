import { type VFC, useCallback } from 'react';

import { PromptForReload } from 'proton-pass-extension/lib/components/Extension/ExtensionError';
import { usePopupContext } from 'proton-pass-extension/lib/hooks/usePopupContext';
import { useRequestForkWithPermissions } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { c } from 'ttag';

import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { clientErrored } from '@proton/pass/lib/client';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const Lobby: VFC = () => {
    const { state, logout } = usePopupContext();
    const errored = clientErrored(state.status);

    const login = useRequestForkWithPermissions({ autoClose: true });
    const handleLogin = () => (errored ? sendMessage(popupMessage({ type: WorkerMessageType.WORKER_INIT })) : login());
    const handleRegister = useCallback(async () => login(FORK_TYPE.SIGNUP), []);

    return (
        <LobbyLayout overlay>
            <LobbyContent
                status={state.status}
                onLogin={handleLogin}
                onLogout={logout}
                onRegister={handleRegister}
                renderError={() => (
                    <PromptForReload
                        message={c('Warning')
                            .t`Something went wrong while starting ${PASS_APP_NAME}. Please try refreshing or reloading the extension`}
                    />
                )}
            />
        </LobbyLayout>
    );
};
