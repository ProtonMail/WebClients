import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';
import { useExtensionState } from 'proton-pass-extension/lib/hooks/useExtensionState';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { clientErrored, clientReady } from '@proton/pass/lib/client';
import { lock, signoutIntent, syncIntent } from '@proton/pass/store/actions';
import { wakeupRequest } from '@proton/pass/store/actions/requests';
import { SyncType } from '@proton/pass/store/sagas/client/sync';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import type { MaybeNull, WorkerMessageWithSender } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import sentry, { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';

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
    const config = usePassConfig();
    const app = useAppState();

    const dispatch = useDispatch();
    const { tabId, url, port } = useExtensionContext();
    const loading = useSelector(selectRequestInFlight(wakeupRequest({ endpoint, tabId })));
    const ready = !loading && clientReady(app.state.status);

    const activityProbe = useExtensionActivityProbe();

    useExtensionState(
        useCallback((state) => {
            setSentryUID(state.UID);
            if (clientErrored(state.status) || state.criticalRuntimeError) {
                onTelemetry(
                    TelemetryEventName.ErrorResumingSession,
                    {},
                    {
                        extensionBrowser: BUILD_TARGET,
                        extensionReloadRequired: Boolean(state.criticalRuntimeError),
                    }
                );
            }
        }, [])
    );

    useEffect(() => {
        sentry({
            config,
            sentryConfig: {
                host: new URL(config.API_URL).host,
                release: config.APP_VERSION,
                environment: `browser-pass::${endpoint}`,
            },
            ignore: () => false,
            denyUrls: [],
        });

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
