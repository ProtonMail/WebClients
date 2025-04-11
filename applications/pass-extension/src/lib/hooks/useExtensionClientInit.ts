import { useCallback, useEffect, useRef, useState } from 'react';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { CriticalMessageResponseError, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { matchExtensionMessage } from '@proton/pass/lib/extension/message/utils';
import { MemoryStorage } from '@proton/pass/lib/file-storage/fs';
import type { AppState } from '@proton/pass/types';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import noop from '@proton/utils/noop';

import { useEndpointMessage } from './useEndpointMessage';

export const useExtensionClientInit = (onStateChange: (state: AppState) => void) => {
    const { endpoint } = usePassCore();
    const { port, tabId } = useExtensionContext();
    const authStore = useAuthStore();
    const message = useEndpointMessage();

    const ready = useRef<Awaiter<void>>(awaiter());
    const [connected, setConnected] = useState(false);

    const onChange = useCallback((state: AppState) => {
        AppStateManager.setState(state);
        authStore?.setLocalID(state.localID);
        authStore?.setUID(state.UID);
        onStateChange(state);
    }, []);

    useEffect(() => {
        const onMessage = (message: unknown) => {
            if (matchExtensionMessage(message, { type: WorkerMessageType.WORKER_STATE_CHANGE })) {
                ready.current.then(() => onChange(message.payload.state)).catch(noop);
                return;
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.FS_WRITE })) {
                const { fileRef, b64 } = message.payload;
                const chunks = MemoryStorage.files.get(fileRef) ?? [];
                chunks.push(base64StringToUint8Array(b64));
                MemoryStorage.files.set(fileRef, chunks);
                return;
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.FS_ERROR })) {
                const { fileRef } = message.payload;
                void MemoryStorage.deleteFile(fileRef);
                return;
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
            .then(({ state }) => onChange(state))
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
