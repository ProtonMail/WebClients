import type { Action } from 'redux';
import type { Task } from 'redux-saga';
import { call, cancel, cancelled, fork, put, select, take, takeLeading } from 'redux-saga/effects';

import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import type { EventManagerEvent } from '@proton/pass/lib/events/manager';
import { channelAcknowledge, wakeupSuccess } from '@proton/pass/store/actions';
import { channelRequest } from '@proton/pass/store/actions/requests';
import type { RequestEntry } from '@proton/pass/store/request/types';
import { selectRequest } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { epochToMs, msToEpoch } from '@proton/pass/utils/time/epoch';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import type { EventChannel } from './types';

/* generic worker over an EventChannel : responsible for polling
 * the underlying redux-saga event channel and triggering the
 * appropriate callback generators. Closes the channel if the
 * parent task is canceled */
export function* channelEventsWorker<T extends {}>(eventChannel: EventChannel<T>, options: RootSagaOptions): Generator {
    const { channel, onEvent, onError, manager } = eventChannel;
    try {
        while (true) {
            try {
                manager.setInterval(options.getPollingInterval());
                const event = (yield take(channel)) as EventManagerEvent<T>;
                yield call(onEvent, event, eventChannel, options);
                yield put(channelAcknowledge(channelRequest(eventChannel.channelId)));
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
export function* channelInitWorker<T extends {}>(
    { manager, channelId }: EventChannel<T>,
    options: RootSagaOptions
): Generator {
    const init = (yield fork(function* () {
        const request: Maybe<RequestEntry<'success'>> = yield select(selectRequest(channelRequest(channelId)));
        const interval = msToEpoch(options.getPollingInterval());
        const delay: number = options.getPollingDelay?.(interval, request?.requestedAt) ?? 0;
        yield wait(epochToMs(delay));
        yield manager.call().catch(noop);
    })) as Task;

    yield takeLeading(
        (action: Action) => wakeupSuccess.match(action) && action.meta.receiver.endpoint === 'popup',
        function* () {
            yield cancel(init);
            yield manager.call().catch(noop);
            /* wait the channel's interval to process
             * the next wakeupSuccess in case user is
             * repeatedly opening the pop-up */
            yield wait(ACTIVE_POLLING_TIMEOUT);
        }
    );
}
