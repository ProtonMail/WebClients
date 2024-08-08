import { type FC } from 'react';

import { usePopupContext } from 'proton-pass-extension/lib/components/Context/PopupProvider';
import { PromptForReload } from 'proton-pass-extension/lib/components/Extension/ExtensionError';
import { useRequestForkWithPermissions } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { clientErrored } from '@proton/pass/lib/client';
import { popupMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const Lobby: FC = () => {
    const { openSettings } = usePassCore();
    const { state, logout } = usePopupContext();
    const errored = clientErrored(state.status);

    const requestFork = useRequestForkWithPermissions({ autoClose: true });

    return (
        <LobbyLayout overlay>
            <LobbyContent
                status={state.status}
                onFork={requestFork}
                onLogin={(options) => sendMessage(popupMessage({ type: WorkerMessageType.AUTH_INIT, options }))}
                onLogout={logout}
                onOffline={noop}
                onRegister={() => requestFork(ForkType.SIGNUP)}
                renderError={() => (
                    <PromptForReload
                        message={c('Warning')
                            .t`Something went wrong while starting ${PASS_APP_NAME}. Please try refreshing or reloading the extension`}
                    />
                )}
                renderFooter={() =>
                    errored ? (
                        <div className="absolute bottom-0 right-0 mb-2 mr-2">
                            <Button
                                color="weak"
                                shape="underline"
                                size="small"
                                className="text-sm color-weak"
                                onClick={() => openSettings?.('logs')}
                            >
                                {c('Action').t`View app logs`}
                            </Button>
                        </div>
                    ) : null
                }
            />
        </LobbyLayout>
    );
};
