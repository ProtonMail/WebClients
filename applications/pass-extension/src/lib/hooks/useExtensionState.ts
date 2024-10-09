import { useCallback, useEffect, useRef } from 'react';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { CriticalMessageResponseError, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { matchExtensionMessage } from '@proton/pass/lib/extension/message/utils';
import type { AppState } from '@proton/pass/types';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { useEndpointMessage } from './useEndpointMessage';

export const useExtensionState = (onStateChange: (state: AppState) => void) => {
    const { endpoint } = usePassCore();
    const { port, tabId } = useExtensionContext();
    const app = useAppState();
    const authStore = useAuthStore();
    const message = useEndpointMessage();

    const ready = useRef<Awaiter<void>>(awaiter());

    const onChange = useCallback((state: AppState) => {
        app.setState(state);
        authStore?.setLocalID(state.localID);
        authStore?.setUID(state.UID);
        onStateChange(state);
    }, []);

    useEffect(() => {
        const onMessage = (message: unknown) => {
            if (matchExtensionMessage(message, { type: WorkerMessageType.WORKER_STATE_CHANGE })) {
                ready.current.then(() => onChange(message.payload.state)).catch(noop);
            }
        };

        port.onMessage.addListener(onMessage);

        const wakeup = () =>
            sendMessage.on(
                message({
                    type: WorkerMessageType.WORKER_WAKEUP,
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
            .finally(ready.current.resolve);

        return () => port.onMessage.removeListener(onMessage);
    }, []);
};
