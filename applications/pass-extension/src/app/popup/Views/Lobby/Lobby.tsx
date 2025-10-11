import { type FC, useCallback } from 'react';

import { useExtensionClient } from 'proton-pass-extension/lib/components/Extension/ExtensionClient';
import { PromptForReload } from 'proton-pass-extension/lib/components/Extension/ExtensionError';
import { useRequestForkWithPermissions } from 'proton-pass-extension/lib/hooks/useRequestFork';
import { popupMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { LobbyContent } from '@proton/pass/components/Layout/Lobby/LobbyContent';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { clientErrored } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

const getCriticalRuntimeErrorMessage = (): string => {
    const base = c('Error').t`Your browser is having difficulties activating ${PASS_APP_NAME}.`;
    const note = c('Info')
        .t`Try reloading or reinstalling the extension and make sure your browser and ${PASS_SHORT_APP_NAME} are up-to-date.`;

    if (BUILD_TARGET === 'safari') {
        const warning = c('Error')
            .t`This may occur after a long time of not using ${PASS_SHORT_APP_NAME}, or clearing your Safari history.`;

        return `${base} ${warning}\n${note}`;
    }

    return `${base}\n${note}`;
};

export const Lobby: FC = () => {
    const { logout } = useExtensionClient();
    const state = useAppState();
    const errored = clientErrored(state.status);

    const requestFork = useRequestForkWithPermissions({ autoClose: true });

    const criticalError = state.criticalRuntimeError ? getCriticalRuntimeErrorMessage() : undefined;
    const autoReload = BUILD_TARGET === 'safari' && state.criticalRuntimeError;

    const viewLogs = useCallback(() => {
        const url = browser.runtime.getURL('/internal.html#/logs');
        browser.tabs.create({ url }).catch(noop);
    }, []);

    return (
        <LobbyLayout>
            <LobbyContent
                error={criticalError}
                status={state.status}
                warning={errored ? c('Warning').t`An error occurred while resuming your session` : undefined}
                onFork={requestFork}
                onLogin={(options) => sendMessage(popupMessage({ type: WorkerMessageType.AUTH_INIT, options }))}
                onLogout={logout}
                onOffline={noop}
                onRegister={() => requestFork(ForkType.SIGNUP)}
                renderError={(message) => <PromptForReload message={message} autoReload={autoReload} browserError />}
                renderFooter={() =>
                    errored ? (
                        <div className="absolute bottom-0 right-0 mb-2 mr-2">
                            <Button
                                color="weak"
                                shape="underline"
                                size="small"
                                className="text-sm color-weak"
                                onClick={viewLogs}
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
