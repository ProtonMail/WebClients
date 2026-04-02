import {
    ConnectivityStatus,
    getConnectivityRetryTimeout,
    intoConnectivityStatus,
} from '@proton/pass/lib/network/connectivity.utils';
import type { Api, ApiSubscriptionEvent, Callback, Maybe } from '@proton/pass/types';
import { asyncLock, cancelable } from '@proton/pass/utils/fp/promises';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import { ping } from '@proton/shared/lib/api/tests';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

export interface ConnectivityService {
    /** getter resolving online state from current status */
    online: boolean;
    /** Triggers connectivity check against server ping endpoint */
    check: () => Promise<ConnectivityStatus>;
    /** Initializes navigator online/offline and API connectivity event listeners */
    init: () => void;
    /** Cancels ongoing retry handlers and resets connectivity state */
    destroy: () => void;
    /** Manually set the connectivity status */
    setStatus: (status: ConnectivityStatus) => void;
    /** Returns current connectivity status */
    getStatus: () => ConnectivityStatus;
    /** Subscribe to connectivity status change notifications */
    subscribe: (subscriber: Subscriber<ConnectivityStatus>) => () => void;
}

export type ConnectivityServiceOptions = { api: Api };

export type ConnectivityState = {
    status: ConnectivityStatus;
    navigatorOnline: boolean;
    retryCount: number;
    retryTimer: Maybe<NodeJS.Timeout>;
    retryCancel: Maybe<Callback>;
};

/** Determines effective online state for retry handler transition detection:
 * requires both API reachability and navigator online. This is intentionally
 * stricter than the public `online` getter which only checks `status`, as the
 * navigator state is used to detect when to start/stop retry handlers. */
const isEffectivelyOnline = ({ status, navigatorOnline }: ConnectivityState) =>
    status === ConnectivityStatus.ONLINE && navigatorOnline;

/** Creates connectivity service managing network state with
 * automatic retry logic and subscriber notifications */
export const createConnectivityService = ({ api }: ConnectivityServiceOptions): ConnectivityService => {
    const target = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : window;

    const listeners = createListenerStore();
    const pubsub = createPubSub<ConnectivityStatus>();

    const state: ConnectivityState = {
        status: ConnectivityStatus[navigator.onLine ? 'ONLINE' : 'OFFLINE'],
        /** NOTE: in extensions this will likely always be truthy as MV3
         * service workers don't seem to react properly to offline events */
        navigatorOnline: navigator.onLine,
        retryCount: 0,
        retryTimer: undefined,
        retryCancel: undefined,
    };

    const setStatus = (status: ConnectivityStatus): void => {
        if (state.status !== status) {
            state.status = status;
            pubsub.publish(status);
        }
    };

    /** Pings server and updates connectivity status. Async-locked to prevent concurrent
     * checks. If requests are in-flight, skips the ping and waits for them to drain instead
     * to avoid a redundant ping race that could produce contradictory state. */
    const check = asyncLock(async (): Promise<ConnectivityStatus> => {
        if (api.getState().pendingCount > 0) await api.idle();
        else await api({ ...ping(), unauthenticated: true }).catch(noop);

        const apiState = api.getState();
        const status = intoConnectivityStatus(apiState);
        setStatus(status);

        await wait(50);
        return status;
    });

    /** Cancels ongoing retry attempts and resets retry state */
    const resetRetryHandler = () => {
        state.retryCount = 0;
        clearTimeout(state.retryTimer);
        state.retryCancel?.();
        state.retryCancel = undefined;
        state.retryTimer = undefined;
    };

    /** Creates retry mechanism with exponential backoff based
     * on retry count and connectivity status */
    const createRetryHandler = () => {
        const cancelableCheck = cancelable(check);

        const handler = safeAsyncCall(async () => {
            const result = await cancelableCheck.run();
            state.retryCount++;

            if (result !== ConnectivityStatus.ONLINE) {
                const ms = getConnectivityRetryTimeout(result, state.retryCount);
                state.retryTimer = setTimeout(handler, ms);
            }
        });

        return { start: handler, cancel: cancelableCheck.cancel };
    };

    /** Handles online/offline state transitions, starting retry
     * logic when offline, stopping when online */
    const onOnlineTransition = (wasOnline: boolean) => {
        const online = isEffectivelyOnline(state);

        if (online !== wasOnline) {
            logger.info(`[ConnectivityService] online=${online} [${state.status}]`);
            resetRetryHandler();
            if (!online) {
                const retryHandler = createRetryHandler();
                state.retryCancel = retryHandler.cancel;
                void retryHandler.start();
            }
        }
    };

    const init = () => {
        const onNavigatorEvent = () => {
            const wasOnline = isEffectivelyOnline(state);
            const online = navigator.onLine;
            state.navigatorOnline = online;
            onOnlineTransition(wasOnline);
        };

        const onApiEvent: Subscriber<ApiSubscriptionEvent> = (event) => {
            if (event.type === 'connectivity') {
                const wasOnline = isEffectivelyOnline(state);
                setStatus(intoConnectivityStatus(event));
                onOnlineTransition(wasOnline);
            }
        };

        listeners.addListener(target, 'online', onNavigatorEvent);
        listeners.addListener(target, 'offline', onNavigatorEvent);
        listeners.addSubscriber(api.subscribe(onApiEvent));

        /** Trigger initial connectivity state transition */
        onOnlineTransition(!isEffectivelyOnline(state));
        void check();
    };

    const destroy = () => {
        listeners.removeAll();
        resetRetryHandler();
    };

    return {
        get online() {
            return state.status === ConnectivityStatus.ONLINE;
        },

        getStatus: () => state.status,
        check,
        setStatus,
        subscribe: (subscriber) => pubsub.subscribe(subscriber),
        init,
        destroy,
    };
};
