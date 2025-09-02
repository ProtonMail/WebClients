import type { AnyStorage, MaybeNull, MaybePromise } from '@proton/pass/types';
import type { Maybe } from '@proton/pass/types';
import { asyncLock, asyncQueue } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import identity from '@proton/utils/identity';
import noop from '@proton/utils/noop';

export type EventBundle<Event> = { sendTime: number; events: Event[]; retryCount: number };
export type EventDispatcherState<Event> = { buffer: Event[]; job: MaybeNull<Promise<void>> };
export type EventDispatchResult = { ok: true } | { ok: false; retry: boolean };

/** Alarm creation is abstracted away behind a simple interface
 * allowing both extension alarms and standard timeouts to be
 * used for implementing the event dispatch triggers */
export type EventDispatcherAlarm = {
    /**  `when` is a UNIX timestamp in milliseconds.  */
    set: (when: number, onAlarm: () => MaybePromise<void>) => MaybePromise<void>;
    /** Resets the alarm */
    reset: () => MaybePromise<any>;
    /** Should return the next scheduled alarm time as a UNIX timestamp in milliseconds */
    when: () => MaybePromise<Maybe<number>>;
};

export type EventDispatcherOptions<Event, StorageKey extends string> = {
    id: string;
    storage: AnyStorage<Record<StorageKey, string>>;
    alarm: EventDispatcherAlarm;
    maxRetries: number;
    dispatch: (bundle: EventBundle<Event>) => Promise<void>;
    getEnabled: () => boolean;
    getSendTime: () => number;
    getStorageKey: () => StorageKey;
    prepare?: (event: Event) => Event;
};

type EventPushOptions<Event> = { dedupeKey?: keyof Event };
export interface EventDispatcher<Event> {
    push: (event: Event, options?: EventPushOptions<Event>) => Promise<boolean>;
    send: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => void;
}

export const createEventDispatcher = <Event, StorageKey extends string = string>(
    options: EventDispatcherOptions<Event, StorageKey>
): EventDispatcher<Event> => {
    const {
        id,
        alarm,
        maxRetries,
        storage,
        dispatch,
        getEnabled,
        getSendTime,
        getStorageKey,
        prepare = identity,
    } = options;
    const log = (message: string) => logger.info(`[EventDispatcher::${id}] ${message}`);

    const shouldSetAlarm = async (): Promise<boolean> => (await alarm.when()) === undefined;
    const createBundle = (): EventBundle<Event> => ({ sendTime: getSendTime(), events: [], retryCount: 0 });
    const saveBundle = (bundle: EventBundle<Event>) => storage.setItem(getStorageKey(), JSON.stringify(bundle));
    const resetBundle = () => storage.removeItem(getStorageKey());
    const shouldSendBundle = ({ sendTime }: { sendTime: number }): boolean => sendTime - getEpoch() <= 0;

    /** Resolves any currently cached event bundle or creates a
     * new one if it does not exist or if we cannot parse it  */
    const resolveBundle = async (): Promise<EventBundle<Event>> => {
        try {
            const bundle = await storage.getItem(getStorageKey());
            if (!bundle) throw new Error();
            return JSON.parse(bundle);
        } catch {
            return createBundle();
        }
    };

    const send = asyncLock(async (): Promise<void> => {
        const bundle = await resolveBundle();
        const { events, retryCount } = bundle;

        if (events.length === 0 || !shouldSendBundle(bundle)) return;

        /* If bundle is non-empty and should be sent, dispatch.
         * On success, clear the locally stored bundle. On failure,
         * increase the retry count for future attempts. */
        const result = await (async (): Promise<EventDispatchResult> => {
            if (retryCount >= maxRetries || !getEnabled()) return { ok: false, retry: false };

            return dispatch(bundle)
                .then<EventDispatchResult>(() => ({ ok: true }))
                .catch<EventDispatchResult>(() => ({ ok: false, retry: true }));
        })();

        const shouldReset = result.ok || !result.retry;

        if (result.ok) log(`Dispatched current bundle [${events.length} event(s)]`);
        if (shouldReset) return resetBundle();
        else {
            log(`Failed sending out bundle. Retrying later...`);
            bundle.retryCount += 1;
            await saveBundle(bundle);
        }
    });

    const setAlarm = async () => {
        if (!getEnabled()) return;
        const bundle = await resolveBundle();

        if (bundle.events.length > 0 && (await shouldSetAlarm())) {
            /* If the API call failed we may hit a sendTime lower than the
             * current time, in this case, retry in 1 minute. */
            const when = Math.max(bundle.sendTime - getEpoch(), UNIX_MINUTE);
            log(`New dispatcher alarm in ${when}s`);

            await alarm.reset();
            await alarm.set((getEpoch() + when) * 1000, send);
        }
    };

    const stop = () => {
        log(`Stopping dispatcher...`);
        alarm.reset();
        void resetBundle();
    };

    const start = async () => {
        try {
            if (!getEnabled()) return stop();

            log(`Starting dispatcher - [enabled: ${getEnabled()}]`);
            const sendTime = await alarm.when();
            if (sendTime) {
                const secondsUntilAlarm = Math.max(sendTime / 1000 - getEpoch(), 0);
                log(`Found dispatcher alarm in ${secondsUntilAlarm}s`);
            } else await setAlarm().catch(noop);
        } catch {}
    };

    /** Use an `asyncQueue` to allow saving events concurrently */
    const push = asyncQueue(async (event: Event, options?: EventPushOptions<Event>): Promise<boolean> => {
        try {
            if (!getEnabled()) return false;

            const bundle = await resolveBundle();

            if (options?.dedupeKey) {
                const key = options.dedupeKey;
                bundle.events = bundle.events.filter((evt) => evt[key] !== event[key]);
            }

            bundle.events.push(prepare(event));
            await saveBundle(bundle);

            /* create the alarm if it was not created on service start.
             * this can happen if no bundles were stored or after a failure
             * when sending out a batch. */
            if (await shouldSetAlarm()) await setAlarm().catch(noop);
            return true;
        } catch {
            return false;
        }
    });

    return { stop, start, push, send };
};
