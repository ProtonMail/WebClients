import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useWorkerStateEvents } from 'proton-pass-extension/lib/hooks/useWorkerStateEvents';

import { useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import type { MessageWithSenderFactory } from '@proton/pass/lib/extension/message';
import { workerReady } from '@proton/pass/lib/worker';
import { sessionLockIntent, signoutIntent, syncIntent } from '@proton/pass/store/actions';
import { wakeupRequest } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import type { ExtensionEndpoint, MaybeNull, WorkerMessageWithSender, WorkerState } from '@proton/pass/types';
import { WorkerStatus } from '@proton/pass/types';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { ExtensionContext, type ExtensionContextType } from '../../context/extension-context';

export const INITIAL_WORKER_STATE: WorkerState = {
    loggedIn: false,
    status: WorkerStatus.IDLE,
    UID: undefined,
};

export interface ExtensionConnectContextValue {
    context: MaybeNull<ExtensionContextType>;
    state: WorkerState;
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

type ExtensionConnectProps<T extends ExtensionEndpoint> = {
    endpoint: T;
    messageFactory: MessageWithSenderFactory;
    onWorkerMessage?: (message: WorkerMessageWithSender) => void;
    children: React.ReactNode;
};

export const ExtensionConnect = <T extends ExtensionEndpoint>({
    endpoint,
    messageFactory,
    onWorkerMessage,
    children,
}: ExtensionConnectProps<T>) => {
    const dispatch = useDispatch();
    const { tabId } = ExtensionContext.get();
    const activityProbe = useActivityProbe(messageFactory);

    const [state, setState] = useState<WorkerState>(INITIAL_WORKER_STATE);
    const wakeupLoading = useSelector(selectRequestInFlight(wakeupRequest({ endpoint, tabId })));
    const ready = !wakeupLoading && workerReady(state.status);

    const logout = useCallback(({ soft }: { soft: boolean }) => {
        setState(INITIAL_WORKER_STATE);
        dispatch(signoutIntent({ soft }));
    }, []);

    const lock = useCallback(() => {
        setState({ ...INITIAL_WORKER_STATE, status: WorkerStatus.LOCKED });
        dispatch(sessionLockIntent());
    }, []);

    const sync = useCallback(() => dispatch(syncIntent()), []);

    useWorkerStateEvents({
        tabId,
        endpoint,
        messageFactory,
        onWorkerStateChange: (workerState) => {
            setSentryUID(workerState.UID);
            setState((prevState) => ({ ...prevState, ...workerState }));
        },
    });

    useEffect(() => {
        if (!onWorkerMessage) return;
        ExtensionContext.get().port.onMessage.addListener(onWorkerMessage);
        return () => ExtensionContext.get().port.onMessage.removeListener(onWorkerMessage);
    });

    useEffect(() => {
        const onVisibilityChange = () => activityProbe[document.visibilityState === 'visible' ? 'start' : 'cancel']();
        document.addEventListener('visibilitychange', onVisibilityChange);
        onVisibilityChange();

        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    const context = useMemo<ExtensionConnectContextValue>(
        () => ({ context: ExtensionContext.get(), state, ready, logout, lock, sync }),
        [state, ready]
    );

    return <ExtensionConnectContext.Provider value={context}>{children}</ExtensionConnectContext.Provider>;
};
