import type { AnyAction } from 'redux';
import { call, cancelled, take, takeLeading } from 'redux-saga/effects';

import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import type { EventManagerEvent } from '@proton/pass/lib/events/manager';
import { wakeupSuccess } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import type { EventChannel } from './types';

/* generic worker over an EventChannel : responsible for polling
 * the underlying redux-saga event channel and triggering the
 * appropriate callback generators. Closes the channel if the
 * parent task is canceled */
export function* channelEventsWorker<T extends {}>(
    eventChannel: EventChannel<T>,
    options: WorkerRootSagaOptions
): Generator {
    const { channel, onEvent, onError, manager } = eventChannel;
    try {
        while (true) {
            try {
                manager.setInterval(options.getEventInterval());
                const event = (yield take(channel)) as EventManagerEvent<T>;
                yield call(onEvent, event, eventChannel, options);
            } catch (error: unknown) {
                logger.warn(`[Saga::Events] received an event error`, error);
                if (onError) yield call(onError, error, eventChannel, options);
            }
        }
    } finally {
        if (yield cancelled()) channel.close();
    }
}

/* This worker will call the event manager immediately and
 * on every wakeupSuccess action coming  from the pop-up in
 * in order to sync as quickly as possible. Take the leading
 * wakeup call in order to avoid unnecessary parallel calls */
export function* channelWakeupWorker<T extends {}>({ manager }: EventChannel<T>): Generator {
    yield manager.call().catch(noop);
    yield takeLeading(
        (action: AnyAction) => wakeupSuccess.match(action) && action.meta.receiver.endpoint === 'popup',
        function* () {
            yield manager.call().catch(noop);
            /* wait the channel's interval to process
             * the next wakeupSuccess in case user is
             * repeatedly opening the pop-up */
            yield wait(ACTIVE_POLLING_TIMEOUT);
        }
    );
}
