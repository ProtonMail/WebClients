import { useCallback, useEffect, useRef, useState } from 'react';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { CriticalMessageResponseError, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { MemoryStorage } from '@proton/pass/lib/file-storage/fs';
import type { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState } from '@proton/pass/types/worker/state';
import { AppStatus } from '@proton/pass/types/worker/state';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { useEndpointMessage } from './useEndpointMessage';

export const useExtensionClientInit = (options: {
    onConnectivity: (connectivity: ConnectivityStatus) => void;
    onSettingsChange?: (settings: ProxiedSettings) => void;
    onStateChange: (state: AppState) => void;
}) => {
    const { endpoint } = usePassCore();
    const { port, tabId } = useExtensionContext();
    const authStore = useAuthStore();
    const message = useEndpointMessage();

    const ready = useRef<Awaiter<void>>(awaiter());
    const [connected, setConnected] = useState(false);

    const onChange = useCallback((state: AppState) => {
        AppStateManager.setState(state);
        options.onStateChange(state);
    }, []);

    useEffect(() => {
        const onMessage = (message: unknown) => {
            if (matchExtensionMessage(message, { type: WorkerMessageType.CONNECTIVITY })) {
                return options.onConnectivity(message.payload.status);
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.WORKER_STATE_CHANGE })) {
                return ready.current.then(() => onChange(message.payload.state)).catch(noop);
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.SETTINGS_UPDATE })) {
                return options.onSettingsChange?.(message.payload);
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.FS_WRITE })) {
                const { fileRef, b64 } = message.payload;
                const chunks = MemoryStorage.files.get(fileRef) ?? [];
                chunks.push(Uint8Array.fromBase64(b64));
                MemoryStorage.files.set(fileRef, chunks);
                return;
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.FS_ERROR })) {
                const { fileRef } = message.payload;
                void MemoryStorage.deleteFile(fileRef);
                return;
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.AUTH_CHANGED })) {
                authStore?.clear();
                return authStore?.setSession(message.payload);
            }
        };

        port.onMessage.addListener(onMessage);

        const wakeup = () =>
            sendMessage.on(
                message({
                    type: WorkerMessageType.CLIENT_INIT,
                    payload: { tabId },
                }),
                (response) => {
                    if (response.type === 'success') return response;

                    logger.warn(`[Endpoint::${endpoint}] wakeup failed`, response.error);
                    if (response.critical) throw new CriticalMessageResponseError();
                    else throw new Error();
                }
            );

        wakeup()
            .then(({ state, connectivity, session }) => {
                onChange(state);
                authStore?.setSession(session);
                options.onConnectivity(connectivity);
            })
            .catch((err) =>
                onChange({
                    authorized: false,
                    booted: false,
                    criticalRuntimeError: err instanceof CriticalMessageResponseError,
                    localID: undefined,
                    status: AppStatus.ERROR,
                    UID: undefined,
                })
            )
            .finally(() => {
                ready.current.resolve();
                setConnected(true);
            });

        return () => port.onMessage.removeListener(onMessage);
    }, []);

    return connected;
};
