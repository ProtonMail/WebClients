import { clientReady } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { type TelemetryStorageKey, createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import type { ExtensionStorage } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import type { EventDispatcherAlarm } from '@proton/pass/utils/event/dispatcher';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

export const TELEMETRY_ALARM_NAME = 'PassTelemetryAlarm';

export const createAlarmHandles = (alarmName: string): EventDispatcherAlarm => {
    return {
        reset: () => browser.alarms.clear(alarmName).catch(noop),
        when: async () => (await browser.alarms.get(alarmName).catch(noop))?.scheduledTime,
        set: (when) => browser.alarms.create(alarmName, { when }),
    };
};

export const createTelemetryService = (storage: ExtensionStorage<Record<TelemetryStorageKey, string>>) => {
    const { push, send, start, stop } = createCoreTelemetryService({
        alarm: createAlarmHandles(TELEMETRY_ALARM_NAME),
        storage,
        getEnabled: () => selectTelemetryEnabled(store.getState()),
        getUserTier: () => selectUserTier(store.getState()),
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.TELEMETRY_EVENT, ({ payload: { event } }) => push(event));

    browser.alarms.onAlarm.addListener(
        withContext((ctx, { name }) => {
            /** Ensure the worker is ready before attempting to send events,
             * as this will be an authenticated call. If the alarm goes off and
             * the worker has not booted, the bundle will be sent on the next boot. */
            const ready = clientReady(ctx.getState().status);
            if (ready && name === TELEMETRY_ALARM_NAME) return send();
        })
    );

    return { start, stop, push };
};

export type TelemetryService = ReturnType<typeof createTelemetryService>;
