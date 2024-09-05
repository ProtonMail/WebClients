import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { createAlarmHandles } from 'proton-pass-extension/app/worker/services/telemetry';
import type { Store } from 'redux';

import { createB2BEventDispatcher } from '@proton/pass/lib/b2b/b2b.dispatcher';
import { clientReady } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ExtensionStorage } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';

export const B2B_EVENTS_ALARM_NAME = 'PassB2BEventsAlarm';
export const B2B_EVENTS_STORAGE_KEY = 'b2bEvents';

export const createB2BEventsService = (
    storage: ExtensionStorage<Record<typeof B2B_EVENTS_STORAGE_KEY, string>>,
    store: Store<State>
) => {
    const { push, send, start, stop } = createB2BEventDispatcher({
        alarm: createAlarmHandles(B2B_EVENTS_ALARM_NAME),
        storage,
        getEnabled: () => isBusinessPlan(selectPassPlan(store.getState())),
        getStorageKey: () => B2B_EVENTS_STORAGE_KEY,
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.B2B_EVENT, ({ payload: { event } }) => push(event));

    browser.alarms.onAlarm.addListener(
        withContext((ctx, { name }) => {
            /** Ensure the worker is ready before attempting to send events,
             * as this will be an authenticated call. If the alarm goes off and
             * the worker has not booted, the bundle will be sent on the next boot. */
            const ready = clientReady(ctx.getState().status);
            if (ready && name === B2B_EVENTS_ALARM_NAME) return send();
        })
    );

    return { start, stop, push };
};

export type B2BEventsService = ReturnType<typeof createB2BEventsService>;
