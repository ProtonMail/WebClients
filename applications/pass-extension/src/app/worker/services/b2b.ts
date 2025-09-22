import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { createExtensionAlarm } from 'proton-pass-extension/lib/utils/alarm';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Store } from 'redux';

import type { B2BEventDispatcher } from '@proton/pass/lib/b2b/b2b.dispatcher';
import { createB2BEventDispatcher } from '@proton/pass/lib/b2b/b2b.dispatcher';
import { clientReady } from '@proton/pass/lib/client';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ExtensionStorage } from '@proton/pass/types';

export const B2B_EVENTS_ALARM_NAME = 'PassB2BEventsAlarm';
export const B2B_EVENTS_STORAGE_KEY = 'b2bEvents';

export const createB2BEventsService = (
    storage: ExtensionStorage<Record<typeof B2B_EVENTS_STORAGE_KEY, string>>,
    store: Store<State>
) => {
    const service: B2BEventDispatcher = createB2BEventDispatcher({
        alarm: createExtensionAlarm(
            B2B_EVENTS_ALARM_NAME,
            withContext((ctx) => {
                /** Ensure the worker is ready before attempting to send events,
                 * as this will be an authenticated call. If the alarm goes off and
                 * the worker has not booted, the bundle will be sent on the next boot. */
                const ready = clientReady(ctx.getState().status);
                if (ready) return service.send();
            })
        ),
        storage,
        getEnabled: () => isBusinessPlan(selectPassPlan(store.getState())),
        getStorageKey: () => B2B_EVENTS_STORAGE_KEY,
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.B2B_EVENT, ({ payload: { event } }) => {
        void service.push(event);
        return true;
    });

    return {
        push: service.push,
        start: service.start,
        stop: service.stop,
    };
};

export type B2BEventsService = ReturnType<typeof createB2BEventsService>;
