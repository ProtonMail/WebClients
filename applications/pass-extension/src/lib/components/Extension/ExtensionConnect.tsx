import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';
import { useWorkerStateEvents } from 'proton-pass-extension/lib/hooks/useWorkerStateEvents';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { authStore } from '@proton/pass/lib/auth/store';
import { clientErrored, clientReady } from '@proton/pass/lib/client';
import type { MessageWithSenderFactory } from '@proton/pass/lib/extension/message/send-message';
import { lock, signoutIntent, syncIntent } from '@proton/pass/store/actions';
import { wakeupRequest } from '@proton/pass/store/actions/requests';
import { SyncType } from '@proton/pass/store/sagas/client/sync';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import type { AppState, ClientEndpoint, MaybeNull, WorkerMessageWithSender } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { ExtensionContext, type ExtensionContextType } from '../../context/extension-context';

export const INITIAL_WORKER_STATE: AppState = {
    authorized: false,
    booted: false,
    localID: undefined,
    status: AppStatus.IDLE,
    UID: undefined,
};

export interface ExtensionConnectContextValue {
    context: MaybeNull<ExtensionContextType>;
    state: AppState;
    ready: boolean;
    logout: (options: { soft: boolean }) => void;
    lock: () => void;
    sync: () => void;
}

export const ExtensionConnectContext = createContext<ExtensionConnectContextValue>({
    context: null,
    state: INITIAL_WORKER_STATE,
    ready: false,
    logout: noop,
    lock: noop,
    sync: noop,
});

type ExtensionConnectProps<T extends ClientEndpoint> = {
    endpoint: T;
    messageFactory: MessageWithSenderFactory;
    onWorkerMessage?: (message: WorkerMessageWithSender) => void;
    children: React.ReactNode;
};

export const ExtensionConnect = <T extends ClientEndpoint>({
    endpoint,
    messageFactory,
    onWorkerMessage,
    children,
}: ExtensionConnectProps<T>) => {
    const { tabId, url } = ExtensionContext.get();
    const { setCurrentTabUrl, onTelemetry } = usePassCore();

    const dispatch = useDispatch();
    const activityProbe = useExtensionActivityProbe(messageFactory);

    const [state, setState] = useState<AppState>(INITIAL_WORKER_STATE);
    const wakeupLoading = useSelector(selectRequestInFlight(wakeupRequest({ endpoint, tabId })));
    const ready = !wakeupLoading && clientReady(state.status);

    useWorkerStateEvents({
        tabId,
        endpoint,
        messageFactory,
        onWorkerStateChange: (workerState) => {
            setSentryUID(workerState.UID);
            setState((prevState) => ({ ...prevState, ...workerState }));
            authStore.setLocalID(workerState.localID);
            if (clientErrored(workerState.status) || workerState.criticalRuntimeError) {
                onTelemetry(
                    TelemetryEventName.ErrorResumingSession,
                    {},
                    {
                        extensionBrowser: BUILD_TARGET,
                        extensionReloadRequired: Boolean(workerState.criticalRuntimeError),
                    }
                );
            }
        },
    });

    useEffect(() => {
        if (url) setCurrentTabUrl?.(url);
        if (onWorkerMessage) {
            ExtensionContext.get().port.onMessage.addListener(onWorkerMessage);
            return () => ExtensionContext.get().port.onMessage.removeListener(onWorkerMessage);
        }
    }, []);

    useVisibleEffect(
        (visible) => {
            if (state.authorized && visible) activityProbe.start();
            else activityProbe.cancel();
        },
        [state.authorized]
    );

    const context = useMemo<ExtensionConnectContextValue>(
        () => ({
            context: ExtensionContext.get(),
            ready,
            state,
            lock: () => {
                setState({ ...INITIAL_WORKER_STATE, status: AppStatus.SESSION_LOCKED });
                dispatch(lock());
            },
            logout: ({ soft }) => {
                setState(INITIAL_WORKER_STATE);
                dispatch(signoutIntent({ soft }));
            },
            sync: () => dispatch(syncIntent(SyncType.FULL)),
        }),
        [state, ready]
    );

    return <ExtensionConnectContext.Provider value={context}>{children}</ExtensionConnectContext.Provider>;
};

export const useExtensionConnect = () => useContext(ExtensionConnectContext);
