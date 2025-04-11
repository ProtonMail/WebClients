import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';
import { useExtensionClientInit } from 'proton-pass-extension/lib/hooks/useExtensionClientInit';
import { reloadManager } from 'proton-pass-extension/lib/utils/reload';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { ThemeConnect } from '@proton/pass/components/Layout/Theme/ThemeConnect';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { clientErrored } from '@proton/pass/lib/client';
import { isExtensionMessage } from '@proton/pass/lib/extension/message/utils';
import { lock, signoutIntent, syncIntent } from '@proton/pass/store/actions';
import { SyncType } from '@proton/pass/store/sagas/client/sync';
import type { MaybeNull, WorkerMessageWithSender } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import sentry, { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { useExtensionContext } from './ExtensionSetup';

export interface ExtensionClientContextValue {
    logout: (options: { soft: boolean }) => void;
    lock: () => void;
    sync: () => void;
}

export const ExtensionClientContext = createContext<MaybeNull<ExtensionClientContextValue>>(null);
export const useExtensionClient = createUseContext(ExtensionClientContext);

type Props = {
    children: (connected: boolean) => ReactNode;
    onWorkerMessage?: (message: WorkerMessageWithSender) => void;
};

export const ExtensionClient: FC<Props> = ({ children, onWorkerMessage }) => {
    const { endpoint, setExtensionClientState, onTelemetry } = usePassCore();
    const config = usePassConfig();

    const dispatch = useDispatch();
    const { url, port, senderTabId } = useExtensionContext();

    const activityProbe = useExtensionActivityProbe();

    const ready = useExtensionClientInit(
        useCallback((state) => {
            if (state.criticalRuntimeError) reloadManager.runtimeReload().catch(noop);

            if (clientErrored(state.status) || state.criticalRuntimeError) {
                onTelemetry(
                    TelemetryEventName.ErrorResumingSession,
                    {},
                    {
                        extensionBrowser: BUILD_TARGET,
                        extensionReloadRequired: state.criticalRuntimeError ? 1 : 0,
                    }
                );
            }

            setSentryUID(state.UID);
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

        setExtensionClientState?.({ url, tabId: senderTabId, port: port.name });

        if (onWorkerMessage) {
            const listener = (message: unknown) => isExtensionMessage(message) && onWorkerMessage(message);
            port.onMessage.addListener(listener);
            return () => port.onMessage.removeListener(listener);
        }
    }, []);

    useVisibleEffect((visible) => {
        if (visible) activityProbe.start();
        else activityProbe.cancel();
    }, []);

    const context = useMemo<ExtensionClientContextValue>(
        () => ({
            lock: () => {
                AppStateManager.reset();
                AppStateManager.setStatus(AppStatus.SESSION_LOCKED);
                dispatch(lock());
            },
            logout: ({ soft }) => {
                AppStateManager.reset();
                dispatch(signoutIntent({ soft }));
            },
            sync: () => dispatch(syncIntent(SyncType.FULL)),
        }),
        []
    );

    return (
        <ExtensionClientContext.Provider value={context}>
            <ThemeConnect />
            {children(ready)}
        </ExtensionClientContext.Provider>
    );
};
