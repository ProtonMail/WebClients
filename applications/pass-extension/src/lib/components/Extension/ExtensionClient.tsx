import type { FC, ReactNode } from 'react';
import { createContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';
import { useWorkerStateEvents } from 'proton-pass-extension/lib/hooks/useWorkerStateEvents';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { clientErrored, clientReady } from '@proton/pass/lib/client';
import { lock, signoutIntent, syncIntent } from '@proton/pass/store/actions';
import { wakeupRequest } from '@proton/pass/store/actions/requests';
import { SyncType } from '@proton/pass/store/sagas/client/sync';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import type { MaybeNull, WorkerMessageWithSender } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';

import { useExtensionContext } from './ExtensionSetup';

export interface ExtensionClientContextValue {
    ready: boolean;
    logout: (options: { soft: boolean }) => void;
    lock: () => void;
    sync: () => void;
}

export const ExtensionClientContext = createContext<MaybeNull<ExtensionClientContextValue>>(null);
export const useExtensionClient = createUseContext(ExtensionClientContext);

type Props = {
    children: ReactNode;
    onWorkerMessage?: (message: WorkerMessageWithSender) => void;
};

export const ExtensionClient: FC<Props> = ({ children, onWorkerMessage }) => {
    const { endpoint, setCurrentTabUrl, onTelemetry } = usePassCore();
    const app = useAppState();
    const authStore = useAuthStore();

    const dispatch = useDispatch();
    const { tabId, url, port } = useExtensionContext();
    const wakeupLoading = useSelector(selectRequestInFlight(wakeupRequest({ endpoint, tabId })));
    const ready = !wakeupLoading && clientReady(app.state.status);

    const activityProbe = useExtensionActivityProbe();

    useWorkerStateEvents((workerState) => {
        setSentryUID(workerState.UID);
        app.setState(workerState);
        authStore?.setLocalID(workerState.localID);

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
    });

    useEffect(() => {
        if (url) setCurrentTabUrl?.(url);
        if (onWorkerMessage) {
            port.onMessage.addListener(onWorkerMessage);
            return () => port.onMessage.removeListener(onWorkerMessage);
        }
    }, []);

    useVisibleEffect(
        (visible) => {
            if (app.state.authorized && visible) activityProbe.start();
            else activityProbe.cancel();
        },
        [app.state.authorized]
    );

    const context = useMemo<ExtensionClientContextValue>(
        () => ({
            ready,
            lock: () => {
                app.reset();
                app.setStatus(AppStatus.SESSION_LOCKED);
                dispatch(lock());
            },
            logout: ({ soft }) => {
                app.reset();
                dispatch(signoutIntent({ soft }));
            },
            sync: () => dispatch(syncIntent(SyncType.FULL)),
        }),
        [ready]
    );

    return <ExtensionClientContext.Provider value={context}>{children}</ExtensionClientContext.Provider>;
};
