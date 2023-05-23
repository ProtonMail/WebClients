import { api } from '@proton/pass/api';
import { browserLocalStorage } from '@proton/pass/extension/storage';
import browser from '@proton/pass/globals/browser';
import { selectUserTier } from '@proton/pass/store';
import { type Maybe, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { type TelemetryEvent } from '@proton/pass/types/data/telemetry';
import { withPayloadLens } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object';
import { UNIX_HOUR, UNIX_MINUTE, getEpoch } from '@proton/pass/utils/time';
import { getSettings } from '@proton/shared/lib/api/settings';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import chunk from '@proton/utils/chunk';
import debounce from '@proton/utils/debounce';

import WorkerMessageBroker from '../channel';
import store from '../store';

type TelemetryEventBundle = {
    sendTime: number;
    events: TelemetryEvent[];
    retryCount: number;
};

type TelemetryServiceContext = {
    active: boolean;
    buffer: TelemetryEvent[];
    job: MaybeNull<Promise<Maybe<TelemetryEventBundle>>>;
};

const MIN_DT = ENV === 'production' ? 6 * UNIX_HOUR : UNIX_MINUTE;
const MAX_DT = ENV === 'production' ? 12 * UNIX_HOUR : 5 * UNIX_MINUTE;
const TELEMETRY_ALARM_NAME = 'PassTelemetryAlarm';
const TELEMETRY_BATCH_SIZE = 100;
const TELEMETRY_MAX_RETRY = 2;

const withUserTier = (event: TelemetryEvent): TelemetryEvent =>
    merge(event, { Dimensions: { user_tier: selectUserTier(store.getState()) } });

const getRandomSendTime = (): number => getEpoch() + MIN_DT + Math.floor(Math.random() * (MAX_DT - MIN_DT));
const shouldSendBundle = ({ sendTime }: TelemetryEventBundle): boolean => sendTime - getEpoch() <= 0;
const createBundle = (): TelemetryEventBundle => ({ sendTime: getRandomSendTime(), events: [], retryCount: 0 });

/* resolves any currently cached telemetry bundle or creates
 * a new one if non exists */
const resolveBundle = async (): Promise<TelemetryEventBundle> => {
    try {
        const cachedBundle = await browserLocalStorage.getItem('telemetry');
        if (!cachedBundle) throw new Error();

        return JSON.parse(cachedBundle);
    } catch (_) {
        const bundle = createBundle();
        await browserLocalStorage.setItem('telemetry', JSON.stringify(bundle));

        return bundle;
    }
};

const isTelemetryEnabled = async (): Promise<boolean> => {
    const { UserSettings } = await api<{ UserSettings: UserSettings }>(getSettings());
    return UserSettings.Telemetry === 1;
};

/* sends all events in current bundle to the telemetry endpoint
 * and returns a boolean indicating success or failure */
const sendBundle = async (bundle: TelemetryEventBundle): Promise<{ ok: true } | { ok: false; retry: boolean }> => {
    try {
        /* skip bundle if we have reached the max retry count or */
        /* if the user settings do not allow telemetry */
        if (bundle.retryCount >= TELEMETRY_MAX_RETRY || !(await isTelemetryEnabled())) {
            return { ok: false, retry: false };
        }

        logger.info(`[Worker::Telemetry] dispatching current bundle [${bundle.events.length} event(s)]`);

        await Promise.all(
            chunk(bundle.events, TELEMETRY_BATCH_SIZE).map((EventInfo) =>
                api({
                    url: 'data/v1/stats/multiple',
                    method: 'post',
                    data: { EventInfo },
                })
            )
        );

        return { ok: true };
    } catch (e) {
        logger.warn(`[Worker::Telemetry] failed to send telemetry bundle`);
        return { ok: false, retry: true };
    }
};

export const createTelemetryService = () => {
    const ctx: TelemetryServiceContext = { active: false, buffer: [], job: null };

    /* If the API call failed we may hit a sendTime lower than the
     * current time, in this case, retry in 1 minute */
    const setAlarm = async (bundle: TelemetryEventBundle) => {
        if (bundle.events.length > 0 && !(await browser.alarms.get(TELEMETRY_ALARM_NAME))) {
            const when = Math.max(bundle.sendTime - getEpoch(), UNIX_MINUTE);
            logger.info(`[Worker::Telemetry] new telemetry alarm in ${when}s`);

            browser.alarms.create(TELEMETRY_ALARM_NAME, { when: (getEpoch() + when) * 1000 });
        }
    };

    /* try to consume the current context's buffer of events - if this
     * method returns a `TelemetryEventBundle` it means it was not sent
     * out and is still "active" - debounce this function in case we have-
     * concurrent events being pushed to the buffer */
    const consumeBuffer = debounce(async (): Promise<void> => {
        await ctx.job; /* ensure no-ongoing job */

        const buffer = ctx.buffer.slice();
        ctx.buffer.length = 0;

        ctx.job = new Promise<Maybe<TelemetryEventBundle>>(async (resolve) => {
            const bundle = await resolveBundle();
            bundle.events = bundle.events.concat(buffer);

            /* if bundle should be sent - ping the telemetry service ASAP
             * and clear the cached bundle only on success */
            if (bundle.events.length > 0 && shouldSendBundle(bundle)) {
                const result = await sendBundle(bundle);

                if (result.ok || !result.retry) {
                    await browserLocalStorage.removeItem('telemetry');
                    return resolve(undefined);
                } else bundle.retryCount += 1;
            }

            /* if the bundle has not reached its sendTime or if the api
             * call failed : update bundle & set the alarm */
            await browserLocalStorage.setItem('telemetry', JSON.stringify(bundle));
            await setAlarm(bundle);
            return resolve(bundle);
        });
    }, 500);

    /* resets the service's context and both clears any registered
     * alarms and any locally stored event bundle  */
    const reset = () => {
        logger.info('[Worker::Telemetry] Clearing telemetry service...');

        void browserLocalStorage.removeItem('telemetry');
        void browser.alarms.clear(TELEMETRY_ALARM_NAME);

        ctx.buffer.length = 0;
        ctx.job = null;
        ctx.active = false;
    };

    const start = async () => {
        try {
            ctx.active = await isTelemetryEnabled();
            logger.info(`[Worker::Telemetry] starting service - [enabled: ${ctx.active}]`);

            void browser.alarms.get(TELEMETRY_ALARM_NAME).then((alarm) => {
                if (alarm) {
                    const when = Math.max(alarm.scheduledTime / 1000 - getEpoch(), 0);
                    logger.info(`[Worker::Telemetry] found telemetry alarm in ${when}s`);
                    if (!ctx.active) reset(); /* clear any alarms if telemetry disabled */
                } else {
                    return consumeBuffer();
                }
            });
        } catch (_) {
            ctx.active = false;
        }
    };

    const pushEvent = async (event: TelemetryEvent): Promise<boolean> => {
        if (ctx.active) {
            logger.info(`[Worker::Telemetry] Adding ${event.Event} to current bundle`);
            ctx.buffer.push(withUserTier(event));

            void consumeBuffer();
            return true;
        }

        return false;
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.TELEMETRY_EVENT, withPayloadLens('event', pushEvent));
    browser.alarms.onAlarm.addListener(({ name }) => name === TELEMETRY_ALARM_NAME && consumeBuffer());

    return { reset, start, pushEvent };
};

export type TelemetryService = ReturnType<typeof createTelemetryService>;
