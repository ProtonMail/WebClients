import type { AnyStorage, MaybeNull, MaybePromise } from '@proton/pass/types';
import { type Maybe } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_HOUR, UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { sendTelemetryBundle } from './telemetry.requests';

export type TelemetryStorageData = { telemetry: string };
export type TelemetryEventBundle = { sendTime: number; events: TelemetryEvent[]; retryCount: number };
export type TelemetryServiceState = { buffer: TelemetryEvent[]; job: MaybeNull<Promise<void>> };

/** Alarm creation is abstracted away behind a simple interface
 * allowing both extension alarms and standard timeouts to be
 * used for implementing the telemetry alarm triggers */
export type TelemetryAlarmHandles = {
    /**  `when` is a UNIX timestamp in milliseconds.  */
    set: (when: number, onAlarm: () => MaybePromise<void>) => MaybePromise<void>;
    /** Resets the alarm */
    reset: () => MaybePromise<any>;
    /** Should return the next scheduled alarm time as a UNIX
     * timestanp in milliseconds */
    when: () => MaybePromise<Maybe<number>>;
};

export type TelemetryServiceOptions = {
    storage: AnyStorage<TelemetryStorageData>;
    alarm: TelemetryAlarmHandles;
    getEnabled: () => boolean;
    getUserTier: () => Maybe<string>;
};

export const TELEMETRY_STORAGE_KEY = 'telemetry';

/* DEV: chrome alarms need to be >60 seconds */
const MIN_DT = ENV === 'production' ? 6 * UNIX_HOUR : UNIX_MINUTE;
const MAX_DT = ENV === 'production' ? 12 * UNIX_HOUR : 2 * UNIX_MINUTE;

const getRandomSendTime = (): number => getEpoch() + MIN_DT + Math.floor(Math.random() * (MAX_DT - MIN_DT));
const shouldSendBundle = ({ sendTime }: TelemetryEventBundle): boolean => sendTime - getEpoch() <= 0;
const createBundle = (): TelemetryEventBundle => ({ sendTime: getRandomSendTime(), events: [], retryCount: 0 });

export const createCoreTelemetryService = ({ storage, getEnabled, getUserTier, alarm }: TelemetryServiceOptions) => {
    const shouldSetAlarm = async (): Promise<boolean> => (await alarm.when()) === undefined;
    const saveBundle = (bundle: TelemetryEventBundle) => storage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(bundle));
    const resetBundle = () => storage.removeItem(TELEMETRY_STORAGE_KEY);

    /** Resolves any currently cached telemetry bundle or creates a
     * new one if it does not exist */
    const resolveBundle = async (): Promise<TelemetryEventBundle> => {
        try {
            const telemetry = await storage.getItem(TELEMETRY_STORAGE_KEY);
            if (!telemetry) throw new Error();
            return JSON.parse(telemetry);
        } catch {
            return createBundle();
        }
    };

    const send = asyncLock(async (): Promise<void> => {
        const bundle = await resolveBundle();

        /* if bundle should be sent - ping the telemetry service ASAP
         * and clear the cached bundle only on success */
        if (bundle.events.length > 0 && shouldSendBundle(bundle)) {
            const result = await sendTelemetryBundle(bundle, getEnabled());

            if (result.ok || !result.retry) return resetBundle();
            else {
                bundle.retryCount += 1;
                await saveBundle(bundle);
            }
        }
    });

    const setAlarm = async () => {
        const bundle = await resolveBundle();

        if (getEnabled() && bundle.events.length > 0 && (await shouldSetAlarm())) {
            /* If the API call failed we may hit a sendTime lower than the
             * current time, in this case, retry in 1 minute. */
            const when = Math.max(bundle.sendTime - getEpoch(), UNIX_MINUTE);
            logger.info(`[Telemetry] new telemetry alarm in ${when}s`);

            await alarm.reset();
            await alarm.set((getEpoch() + when) * 1000, send);
        }
    };

    const stop = () => {
        logger.info('[Telemetry] Clearing telemetry service...');
        alarm.reset();
        void resetBundle();
    };

    const start = async () => {
        try {
            logger.info(`[Telemetry] starting service - [enabled: ${getEnabled()}]`);
            const sendTime = await alarm.when();
            if (sendTime) {
                const secondsUntilAlarm = Math.max(sendTime / 1000 - getEpoch(), 0);
                logger.info(`[Telemetry] found telemetry alarm in ${secondsUntilAlarm}s`);
                if (!getEnabled()) stop();
            } else void setAlarm();
        } catch {}
    };

    const push = async (event: TelemetryEvent): Promise<boolean> => {
        try {
            if (getEnabled()) {
                logger.info(`[Telemetry] Adding ${event.Event} to current bundle`);

                const bundle = await resolveBundle();
                bundle.events.push(merge(event, { Dimensions: { user_tier: getUserTier() } }));
                await saveBundle(bundle);

                /* create the alarm if it was not created on service start.
                 * this can happen if no bundles were stored or after a failure
                 * when sending out a batch.  */
                if (await shouldSetAlarm()) setAlarm().catch(noop);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    return { stop, start, push, send };
};

export type TelemetryService = ReturnType<typeof createCoreTelemetryService>;
