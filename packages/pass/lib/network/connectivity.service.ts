import {
    ConnectivityStatus,
    getConnectivityRetryTimeout,
    intoConnectivityStatus,
} from '@proton/pass/lib/network/connectivity.utils';
import type { Api, ApiSubscriptionEvent, MaybeNull } from '@proton/pass/types';
import { asyncLock, cancelable } from '@proton/pass/utils/fp/promises';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import { ping } from '@proton/shared/lib/api/tests';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

/**
 * Reconciles `navigator.onLine` and the API's connectivity state into a single
 * `ConnectivityStatus`. Drives a retry loop while degraded. Both inputs are kept
 * decoupled as navigator can lie & API state is only as fresh as the last request.
 *
 * Retry: Each tick fires `probe()`, which is bounded by `CONNECTIVITY_PROBE_TIMEOUT`
 * and bypasses the threshold queue via `prioritize`. `TimeoutError` classifies as
 * as OFFLINE in the api factory.
 *
 * Reconciliation paths:
 * - API: `onApiEvent` broadcasts on state change & re-evaluates retry handler.
 * - Navigator events: online → offline quick-switches to OFFLINE (device beats stale API).
 *   offline → online: flips to ONLINE if API agrees or probes via `check()` otherwise.
 * - `check()`: manual probe, rewinds backoff.
 */

export interface ConnectivityService {
    /** getter resolving online state from current status */
    readonly online: boolean;
    /** Returns current connectivity status */
    readonly status: ConnectivityStatus;
    /** Current active retry handler */
    readonly retryHandler: MaybeNull<ConnectivityRetryHandler>;
    /** Triggers connectivity check against server ping endpoint */
    check: () => Promise<ConnectivityStatus>;
    /** Initializes navigator online/offline and API connectivity event listeners */
    init: () => Promise<void>;
    /** Cancels ongoing retry handlers and resets connectivity state */
    destroy: () => void;
    /** Manually set the connectivity status */
    setStatus: (status: ConnectivityStatus) => void;
    /** Subscribe to connectivity events. */
    subscribe: (subscriber: Subscriber<ConnectivityEvent>) => () => void;
    /** Sync navigator online state into the service. Extension only usage
     * to forward client-side signals when worker navigator events are unreliable. */
    syncNavigatorOnline: (online: boolean) => void;
}

export type GetRetryTimeout = (status: ConnectivityStatus, retryCount: number) => number;

type ConnectivityServiceOptions = {
    api: Api;
    /** Strategy controlling delay between retries. Defaults to
     * `getConnectivityRetryTimeout` (linear for OFFLINE, fib for DOWNTIME). */
    getRetryTimeout?: GetRetryTimeout;
};
type ConnectivityRetryHandler = { start: () => void; cancel: () => void; reset: () => void };

export type ConnectivityState = {
    status: ConnectivityStatus;
    navigatorOnline: boolean;
    retryHandler: MaybeNull<ConnectivityRetryHandler>;
};

export type ConnectivityEvent = { type: 'status'; status: ConnectivityStatus } | { type: 'navigator-online' };

export const CONNECTIVITY_PROBE_DELAY = 50; /** ms */
export const CONNECTIVITY_PROBE_TIMEOUT = 5_000; /** ms */

/** Determines effective online state for retry handler transition detection:
 * requires both API reachability and navigator online. This is intentionally
 * stricter than the public `online` getter which only checks `status`, as the
 * navigator state is used to detect when to start/stop retry handlers. */
const isEffectivelyOnline = ({ status, navigatorOnline }: ConnectivityState) =>
    status === ConnectivityStatus.ONLINE && navigatorOnline;

/** Creates connectivity service managing network state with
 * automatic retry logic and subscriber notifications */
export const createConnectivityService = ({
    api,
    getRetryTimeout = getConnectivityRetryTimeout,
}: ConnectivityServiceOptions): ConnectivityService => {
    const target = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : window;

    const listeners = createListenerStore();
    const pubsub = createPubSub<ConnectivityEvent>();

    const state: ConnectivityState = {
        status: ConnectivityStatus[navigator.onLine ? 'ONLINE' : 'OFFLINE'],
        /** NOTE: in extensions this will likely always be truthy as MV3
         * service workers don't seem to react properly to offline events */
        navigatorOnline: navigator.onLine,
        retryHandler: null,
    };

    const setStatus = (status: ConnectivityStatus): void => {
        if (state.status !== status) {
            state.status = status;
            pubsub.publish({ type: 'status', status });
        }
    };

    /** Internal: pings the server and updates connectivity status. Async-locked
     * so concurrent callers share the same in-flight ping. Used by the retry
     * handler and by the bootstrap path - external callers go through `check`.
     * `timeout` caps a stalled fetch (eg: Safari hangs offline) at `CONNECTIVITY_PROBE_TIMEOUT`;
     * API factory classifies the resulting `TimeoutError` as OFFLINE. */
    const probe = asyncLock(async (signal?: AbortSignal): Promise<ConnectivityStatus> => {
        await api({
            ...ping(),
            unauthenticated: true,
            timeout: CONNECTIVITY_PROBE_TIMEOUT,
            prioritize: true,
            signal,
        }).catch(noop);

        const status = intoConnectivityStatus(api.getState());
        setStatus(status);

        await wait(CONNECTIVITY_PROBE_DELAY);

        return status;
    });

    /** Any user-initiated connectivity recheck goes through here so
     * the retry chain doesn't sit on a stale fib step after a manual probe. */
    const check = async (): Promise<ConnectivityStatus> => {
        const status = await probe();
        state.retryHandler?.reset();
        return status;
    };

    /** Creates retry mechanism with exponential backoff based
     * on retry count and connectivity status */
    const createRetryHandler = (status: ConnectivityStatus) => {
        let retryCount = 0;
        let retryTimer: NodeJS.Timeout;

        const cancelableCheck = cancelable(probe);

        const handler = (next: ConnectivityStatus) => {
            const ms = getRetryTimeout(next, retryCount);

            retryTimer = setTimeout(
                safeAsyncCall(async () => {
                    retryCount++;
                    const result = await cancelableCheck.run();
                    if (result !== ConnectivityStatus.ONLINE) handler(result);
                }),
                ms
            );
        };

        return {
            start: () => handler(status),
            cancel: () => {
                cancelableCheck.cancel();
                clearTimeout(retryTimer);
            },
            reset: () => {
                retryCount = 0;
                clearTimeout(retryTimer);
                handler(state.status);
            },
        };
    };

    /** Handles online/offline state transitions, starting retry
     * logic when offline, stopping when online */
    const onConnectivityChange = (wasOnline?: boolean) => {
        const online = isEffectivelyOnline(state);

        if (online !== wasOnline) {
            logger.info(`[ConnectivityService] online=${online} [${state.status}]`);

            state.retryHandler?.cancel();
            state.retryHandler = null;

            if (!online) {
                state.retryHandler = createRetryHandler(state.status);
                void state.retryHandler.start();
            }
        }
    };

    const syncNavigatorOnline = (online: boolean): void => {
        const wasNavigatorOnline = state.navigatorOnline;
        const transitioned = wasNavigatorOnline !== online;
        if (!transitioned) return;

        state.navigatorOnline = online;

        if (online) {
            pubsub.publish({ type: 'navigator-online' });
            setStatus(intoConnectivityStatus(api.getState()));
            if (!isEffectivelyOnline(state)) void check();
        } else setStatus(ConnectivityStatus.OFFLINE);

        onConnectivityChange();
    };

    const init = async () => {
        const onNavigatorEvent = () => syncNavigatorOnline(navigator.onLine);

        const onApiEvent: Subscriber<ApiSubscriptionEvent> = (event) => {
            if (event.type === 'connectivity') {
                const wasOnline = isEffectivelyOnline(state);
                setStatus(intoConnectivityStatus(event));
                onConnectivityChange(wasOnline);
            }
        };

        listeners.addListener(target, 'online', onNavigatorEvent);
        listeners.addListener(target, 'offline', onNavigatorEvent);
        listeners.addSubscriber(api.subscribe(onApiEvent));

        /** Bootstrap initial connectivity state: starts the retry handler immediately
         * if offline, or falls back to a direct check to detect unreachable API state. */
        onConnectivityChange();
        if (!state.retryHandler) await probe().then(() => onConnectivityChange());
    };

    const destroy = () => {
        listeners.removeAll();
        state.retryHandler?.cancel();
        state.retryHandler = null;
    };

    return {
        get online() {
            return state.status === ConnectivityStatus.ONLINE;
        },

        get status() {
            return state.status;
        },

        get retryHandler() {
            return state.retryHandler;
        },

        check,
        setStatus,
        subscribe: (subscriber) => pubsub.subscribe(subscriber),
        syncNavigatorOnline,
        init,
        destroy,
    };
};
