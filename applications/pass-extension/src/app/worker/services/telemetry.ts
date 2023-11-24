import browser from '@proton/pass/lib/globals/browser';
import type { TelemetryStorageData } from '@proton/pass/lib/telemetry/service';
import { createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import type { Storage } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const TELEMETRY_ALARM_NAME = 'PassTelemetryAlarm';

export const createTelemetryService = (storage: Storage<TelemetryStorageData>) => {
    const { push, send, start, stop } = createCoreTelemetryService({
        alarm: {
            reset: () => browser.alarms.clear(TELEMETRY_ALARM_NAME).catch(noop),
            when: async () => (await browser.alarms.get(TELEMETRY_ALARM_NAME))?.scheduledTime,
            set: (when) => browser.alarms.create(TELEMETRY_ALARM_NAME, { when }),
        },
        getEnabled: () => selectTelemetryEnabled(store.getState()),
        getUserTier: () => selectUserTier(store.getState()),
        storage,
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.TELEMETRY_EVENT, ({ payload: { event } }) => push(event));
    browser.alarms.onAlarm.addListener(({ name }) => name === TELEMETRY_ALARM_NAME && send());

    return { start, stop, push };
};

export type TelemetryService = ReturnType<typeof createTelemetryService>;
